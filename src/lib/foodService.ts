import { calculateNutriScore } from "./calculateNutriScore";
import { detectRedFlags } from "./redFlags";
import { findMockProductByBarcode, MOCK_PRODUCTS, searchMockProducts } from "./mockData";
import type { NutriGrade, NutrientsPer100g, Product, ScoredProduct } from "./types";
import { getContributedScoredProduct } from "./contributions";

const OFF_BASE =
  process.env.NEXT_PUBLIC_OFF_API_BASE ?? "https://world.openfoodfacts.org";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "NutriScore-IN";
const CONTACT = process.env.NEXT_PUBLIC_APP_CONTACT ?? "support@example.com";

// OFF's usage policy asks for a descriptive User-Agent; browsers won't let
// us set that header directly on fetch, so we pass it as a query param
// where supported and keep it documented here for any server-side calls.
const USER_AGENT = `${APP_NAME}/1.0 (${CONTACT})`;

export class FoodServiceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "FoodServiceError";
  }
}

// ---------------------------------------------------------------------------
// Raw Open Food Facts response shapes (subset of fields we actually use)
// ---------------------------------------------------------------------------

interface OFFNutriments {
  "energy-kcal_100g"?: number;
  "energy-kcal"?: number;
  fat_100g?: number;
  "saturated-fat_100g"?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fiber_100g?: number;
  proteins_100g?: number;
  sodium_100g?: number; // grams
  salt_100g?: number; // grams
  "fruits-vegetables-nuts-estimate-from-ingredients_100g"?: number;
}

interface OFFProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  categories?: string;
  image_front_url?: string;
  image_url?: string;
  quantity?: string;
  serving_size?: string;
  serving_quantity?: string | number;
  ingredients_text?: string;
  ingredients_text_en?: string;
  additives_tags?: string[]; // e.g. ["en:e621", "en:e322"]
  nutriscore_grade?: string;
  nutriments?: OFFNutriments;
  countries_tags?: string[];
}

interface OFFProductResponse {
  status: number;
  product?: OFFProduct;
}

interface OFFSearchResponse {
  products?: OFFProduct[];
  count?: number;
}

// ---------------------------------------------------------------------------
// Normalization: raw OFF payload -> our internal Product shape
// ---------------------------------------------------------------------------

function normalizeOFFProduct(raw: OFFProduct): Product | null {
  const n = raw.nutriments ?? {};
  const energyKcal = n["energy-kcal_100g"] ?? n["energy-kcal"];
  // A product with no usable energy value can't be scored or meaningfully
  // displayed — treat it as absent rather than showing broken numbers.
  if (energyKcal === undefined) return null;

  const sodium = n.sodium_100g ?? (n.salt_100g !== undefined ? n.salt_100g / 2.5 : 0);

  const nutrients: NutrientsPer100g = {
    energyKcal,
    fat: n.fat_100g ?? 0,
    saturatedFat: n["saturated-fat_100g"] ?? 0,
    carbohydrates: n.carbohydrates_100g ?? 0,
    sugars: n.sugars_100g ?? 0,
    fiber: n.fiber_100g ?? 0,
    protein: n.proteins_100g ?? 0,
    sodium,
    fruitVegNutPercent: n["fruits-vegetables-nuts-estimate-from-ingredients_100g"],
  };

  const servingGrams = raw.serving_quantity ? Number(raw.serving_quantity) : undefined;

  return {
    id: raw.code,
    barcode: raw.code,
    name: raw.product_name_en || raw.product_name || "Unnamed product",
    brand: raw.brands?.split(",")[0]?.trim() || "Unknown brand",
    category: raw.categories?.split(",")[0]?.trim(),
    imageUrl: raw.image_front_url || raw.image_url,
    quantity: raw.quantity,
    servingSize: raw.serving_size,
    servingSizeGrams: Number.isFinite(servingGrams) ? servingGrams : undefined,
    ingredientsText: raw.ingredients_text_en || raw.ingredients_text,
    additives: raw.additives_tags?.map((t) => t.replace("en:", "").toUpperCase()),
    nutrients,
    sourceGrade: isNutriGrade(raw.nutriscore_grade) ? raw.nutriscore_grade : undefined,
    source: "openfoodfacts",
    countryTags: raw.countries_tags,
  };
}

function isNutriGrade(value: unknown): value is NutriGrade {
  return typeof value === "string" && ["a", "b", "c", "d", "e"].includes(value);
}

// ---------------------------------------------------------------------------
// Scoring: attach a grade (source-provided or calculated) + red flags
// ---------------------------------------------------------------------------

export function scoreProduct(product: Product): ScoredProduct {
  if (product.sourceGrade) {
    return {
      ...product,
      grade: product.sourceGrade,
      gradeSource: "provided",
      points: { negative: 0, positive: 0, final: 0 },
      redFlags: detectRedFlags(product),
    };
  }

  const result = calculateNutriScore(product.nutrients);
  return {
    ...product,
    grade: result.grade,
    gradeSource: "calculated",
    points: {
      negative: result.negativePoints,
      positive: result.positivePoints,
      final: result.finalScore,
    },
    redFlags: detectRedFlags(product),
  };
}

// ---------------------------------------------------------------------------
// Public API: barcode lookup + text search, each with mock fallback
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
  } finally {
    clearTimeout(timeout);
  }
}

export interface LookupResult {
  product: ScoredProduct | null;
  usedFallback: boolean;
}

/** Look up a single product by EAN/UPC barcode (from a scan). */
/** Look up a single product by EAN/UPC barcode (from a scan). */
export async function getProductByBarcode(barcode: string): Promise<LookupResult> {
    const fields = [
        "code", "product_name", "product_name_en", "brands", "categories",
        "image_front_url", "image_url", "quantity", "serving_size", "serving_quantity",
        "ingredients_text", "ingredients_text_en", "additives_tags",
        "nutriscore_grade", "nutriments", "countries_tags",
    ].join(",");

    try {
        const url = `${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${fields}&user_agent=${encodeURIComponent(USER_AGENT)}`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) throw new FoodServiceError(`Open Food Facts responded with ${res.status}`);
        const data: OFFProductResponse = await res.json();

        if (data.status === 1 && data.product) {
            const normalized = normalizeOFFProduct(data.product);
            if (normalized) return { product: scoreProduct(normalized), usedFallback: false };
        }

        // Not found upstream — try the local Indian mock dataset next, then any
        // community contribution saved on this device, before giving up.
        const mock = findMockProductByBarcode(barcode);
        if (mock) return { product: scoreProduct(mock), usedFallback: true };

        const contributed = getContributedScoredProduct(barcode);
        return { product: contributed ?? null, usedFallback: true };
    } catch (err) {
        // Network failure / timeout / parsing error — fall back gracefully.
        const mock = findMockProductByBarcode(barcode);
        if (mock) return { product: scoreProduct(mock), usedFallback: true };

        const contributed = getContributedScoredProduct(barcode);
        if (contributed) return { product: contributed, usedFallback: true };

        throw new FoodServiceError(
            "Couldn't reach Open Food Facts and no offline match was found.",
            err
        );
    }
}

/** Debounced-caller-friendly text search, scoped to products sold in India. */
export async function searchProducts(query: string, signal?: AbortSignal): Promise<{
  results: ScoredProduct[];
  usedFallback: boolean;
}> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { results: [], usedFallback: false };

  const fields = [
    "code", "product_name", "product_name_en", "brands", "categories",
    "image_front_url", "image_url", "quantity", "serving_size", "serving_quantity",
    "ingredients_text", "ingredients_text_en", "additives_tags",
    "nutriscore_grade", "nutriments", "countries_tags",
  ].join(",");

  const params = new URLSearchParams({
    search_terms: trimmed,
    countries_tags_en: "india",
    fields,
    page_size: "12",
    json: "1",
    user_agent: USER_AGENT,
  });

  try {
    const url = `${OFF_BASE}/cgi/search.pl?${params.toString()}`;
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new FoodServiceError(`Open Food Facts responded with ${res.status}`);
    const data: OFFSearchResponse = await res.json();

    const normalized = (data.products ?? [])
      .map(normalizeOFFProduct)
      .filter((p): p is Product => p !== null)
      .map(scoreProduct);

    if (normalized.length > 0) return { results: normalized, usedFallback: false };

    // Zero results from OFF for an India-scoped query is common for niche
    // regional brands — widen to the local mock dataset as a courtesy.
    const mockResults = searchMockProducts(trimmed).map(scoreProduct);
    return { results: mockResults, usedFallback: true };
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err; // let caller ignore aborted requests
    const mockResults = searchMockProducts(trimmed).map(scoreProduct);
    return { results: mockResults, usedFallback: true };
  }
}

/** Suggests better-scoring alternatives in the same category (D/E products only). */
export function getAlternatives(product: ScoredProduct, limit = 3): ScoredProduct[] {
  const pool = MOCK_PRODUCTS.filter((p) => p.id !== product.id).map(scoreProduct);
  const sameCategory = pool.filter(
    (p) => p.category && product.category && p.category === product.category
  );
  const candidates = (sameCategory.length > 0 ? sameCategory : pool)
    .filter((p) => p.grade < product.grade) // 'a' < 'e' lexically = better grade
    .sort((a, b) => a.grade.localeCompare(b.grade));
  return candidates.slice(0, limit);
}
