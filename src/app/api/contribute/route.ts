import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never statically cache a mutation endpoint

interface ContributionPayload {
    barcode: string;
    name: string;
    brand: string;
    energyKcal: number;
    saturatedFat: number;
    addedSugar: number;
    sodiumMg: number;
    protein: number;
    fiber: number;
    hasPalmOil: boolean;
}

function isValidPayload(body: unknown): body is ContributionPayload {
    if (!body || typeof body !== "object") return false;
    const b = body as Record<string, unknown>;
    return (
        typeof b.barcode === "string" &&
        b.barcode.trim().length > 0 &&
        typeof b.name === "string" &&
        b.name.trim().length > 0 &&
        typeof b.brand === "string" &&
        typeof b.energyKcal === "number" &&
        Number.isFinite(b.energyKcal) &&
        typeof b.saturatedFat === "number" &&
        Number.isFinite(b.saturatedFat) &&
        typeof b.addedSugar === "number" &&
        Number.isFinite(b.addedSugar) &&
        typeof b.sodiumMg === "number" &&
        Number.isFinite(b.sodiumMg) &&
        typeof b.protein === "number" &&
        Number.isFinite(b.protein) &&
        typeof b.fiber === "number" &&
        Number.isFinite(b.fiber) &&
        typeof b.hasPalmOil === "boolean"
    );
}

// TODO(backend): replace this module-level array with a real INSERT against
// Supabase/PostgreSQL — e.g. `supabase.from("contributions").insert(body)`.
// This in-memory list exists only so the route has something to hand back
// in dev; it resets on every server restart / serverless cold start and is
// NOT durable storage. Client persistence for now lives in
// `src/lib/contributions.ts` (localStorage).
const pendingContributions: ContributionPayload[] = [];

export async function POST(req: NextRequest) {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!isValidPayload(body)) {
        return NextResponse.json(
            {
                error:
                    "Missing or invalid fields. Required: barcode, name, brand, energyKcal, " +
                    "saturatedFat, addedSugar, sodiumMg, protein, fiber, hasPalmOil.",
            },
            { status: 400 }
        );
    }

    pendingContributions.push(body);

    return NextResponse.json(
        {
            status: "accepted",
            message:
                "Contribution received and queued. Currently held in-memory only — " +
                "point this route at Supabase/PostgreSQL for durable storage.",
            barcode: body.barcode,
        },
        { status: 202 }
    );
}

// Dev/debug helper — inspect what's queued in this server instance.
// Remove or gate behind an admin check before any real deployment.
export async function GET() {
    return NextResponse.json({ count: pendingContributions.length, items: pendingContributions });
}