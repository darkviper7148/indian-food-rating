import { calculateNutriScore } from "./calculateNutriScore";
import { detectRedFlags } from "./redFlags";
import type { ContributionInput, Product, ScoredProduct } from "./types";

// Deliberately does NOT import from `foodService.ts` — `foodService.ts`
// imports *from* this file as a barcode-lookup fallback, so keeping the
// dependency one-directional avoids a circular import.

const STORAGE_KEY = "nutriscore_in:contributions:v1";

function isBrowser() {
    return typeof window !== "undefined";
}

/** Maps a community form submission into our normalized `Product` shape. */
export function contributionToProduct(input: ContributionInput): Product {
    return {
        id: input.barcode.trim(),
        barcode: input.barcode.trim(),
        name: input.name.trim(),
        brand: input.brand.trim() || "Community submission",
        ingredientsText: input.hasPalmOil
            ? "Contains palm oil / hydrogenated vegetable oil (user-reported)"
            : undefined,
        additives: [],
        nutrients: {
            energyKcal: Math.max(0, input.energyKcal),
            fat: 0, // not collected on the community form — excluded from Nutri-Score negatives
            saturatedFat: Math.max(0, input.saturatedFat),
            carbohydrates: 0, // not collected — does not feed into the scoring algorithm
            sugars: Math.max(0, input.addedSugar),
            fiber: Math.max(0, input.fiber),
            protein: Math.max(0, input.protein),
            sodium: Math.max(0, input.sodiumMg) / 1000, // mg -> g, matches internal unit
            fruitVegNutPercent: 0,
        },
        source: "community",
        countryTags: ["india"],
    };
}

function scoreContributedProduct(product: Product): ScoredProduct {
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

/** Client-side score preview — safe to call on every keystroke, no I/O. */
export function previewContribution(input: ContributionInput): ScoredProduct {
    return scoreContributedProduct(contributionToProduct(input));
}

function readAll(): Record<string, Product> {
    if (!isBrowser()) return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, Product>;
    } catch {
        return {};
    }
}

function writeAll(all: Record<string, Product>) {
    if (!isBrowser()) return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
        // Quota exceeded / private-mode storage disabled — the user still gets
        // an instant scored result for this session, it just won't persist.
    }
}

/**
 * Saves a contribution to localStorage (keyed by barcode) and returns the
 * scored product for immediate display. Also fires a best-effort POST to
 * `/api/contribute` — failures there are swallowed since localStorage is
 * the source of truth until a real backend is wired up (Phase 2+).
 */
export function saveContribution(input: ContributionInput): ScoredProduct {
    const product = contributionToProduct(input);
    const all = readAll();
    all[product.barcode] = product;
    writeAll(all);

    void fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    }).catch(() => {
        // Offline / API unavailable — the local save already succeeded.
    });

    return scoreContributedProduct(product);
}

/** Looks up a previously-saved community contribution by barcode, if any. */
export function getContributedScoredProduct(barcode: string): ScoredProduct | undefined {
    const product = readAll()[barcode];
    return product ? scoreContributedProduct(product) : undefined;
}

export function listContributions(): Product[] {
    return Object.values(readAll());
}