import { NextResponse, type NextRequest } from "next/server";

/**
 * Caching proxy for Open Food Facts single-product lookups.
 *
 * Two cache layers work together here:
 *  1. An in-memory Map, scoped to this server process. On Vercel that's
 *     one warm serverless/edge instance — not shared across regions or
 *     cold starts, but it's what gets repeat scans within a session (or
 *     across users hitting the same warm instance) down to sub-100ms with
 *     zero network round-trip.
 *  2. `Cache-Control: s-maxage / stale-while-revalidate` response headers,
 *     which Vercel's own CDN respects — this is what gives real cross-
 *     instance, cross-region caching in production, independent of which
 *     serverless instance happens to handle a given request.
 *
 * Stale-while-revalidate semantics are implemented for both layers: a
 * request for data that's gone stale (but not yet expired) is answered
 * immediately from cache while a fresh copy is fetched in the background
 * for the *next* request — the current caller never waits on it.
 */

export const dynamic = "force-dynamic"; // we manage freshness ourselves below

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
}

const CACHE = new Map<string, CacheEntry>();

const FRESH_MS = 10 * 60 * 1000; // served instantly, no revalidation at all
const STALE_MS = 60 * 60 * 1000; // served instantly, revalidated in the background
const FETCH_TIMEOUT_MS = 8000;

const OFF_BASE =
  process.env.NEXT_PUBLIC_OFF_API_BASE ?? "https://world.openfoodfacts.org";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "NutriScore-IN";
const CONTACT = process.env.NEXT_PUBLIC_APP_CONTACT ?? "support@example.com";
const USER_AGENT = `${APP_NAME}/1.0 (${CONTACT})`;

const FIELDS = [
  "code", "product_name", "product_name_en", "brands", "categories",
  "image_front_url", "image_url", "quantity", "serving_size", "serving_quantity",
  "ingredients_text", "ingredients_text_en", "additives_tags",
  "nutriscore_grade", "nutriments", "countries_tags",
].join(",");

async function fetchFromOFF(barcode: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const url = `${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}&user_agent=${encodeURIComponent(USER_AGENT)}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Open Food Facts responded with ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function revalidateInBackground(barcode: string) {
  fetchFromOFF(barcode)
    .then((data) => CACHE.set(barcode, { data, fetchedAt: Date.now() }))
    .catch(() => {
      /* keep serving the existing stale entry — a failed background
         revalidation is invisible to whoever already got a response */
    });
}

const CACHE_CONTROL_HEADER = "public, s-maxage=600, stale-while-revalidate=3000";

export async function GET(
  _request: NextRequest,
  { params }: { params: { barcode: string } }
) {
  const barcode = params.barcode?.trim();
  if (!barcode) {
    return NextResponse.json({ status: 0, error: "Missing barcode" }, { status: 400 });
  }

  const cached = CACHE.get(barcode);
  const age = cached ? Date.now() - cached.fetchedAt : Infinity;

  if (cached && age < FRESH_MS) {
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": CACHE_CONTROL_HEADER, "X-Cache": "HIT" },
    });
  }

  if (cached && age < STALE_MS) {
    revalidateInBackground(barcode);
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": CACHE_CONTROL_HEADER, "X-Cache": "STALE" },
    });
  }

  try {
    const data = await fetchFromOFF(barcode);
    CACHE.set(barcode, { data, fetchedAt: Date.now() });
    return NextResponse.json(data, {
      headers: { "Cache-Control": CACHE_CONTROL_HEADER, "X-Cache": "MISS" },
    });
  } catch (err) {
    // Fully expired and the live fetch also failed — an old cached copy
    // beats no copy at all, so fall back to it if we have one.
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "X-Cache": "STALE-ON-ERROR",
        },
      });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ status: 0, error: message }, { status: 502 });
  }
}
