// ---------------------------------------------------------------------------
// Domain types. `Product` is our normalized shape — both the Open Food Facts
// client and the mock dataset produce this, so every component downstream
// only ever deals with one shape regardless of data source.
// ---------------------------------------------------------------------------

export type NutriGrade = "a" | "b" | "c" | "d" | "e";

export interface NutrientsPer100g {
  energyKcal: number;
  fat: number;
  saturatedFat: number;
  carbohydrates: number;
  sugars: number;
  fiber: number;
  protein: number;
  /** grams of sodium per 100g (NOT salt — convert salt via salt / 2.5) */
  sodium: number;
  /** 0-100, estimated % fruit / vegetable / nut / pulse / olive-walnut-rapeseed oil content */
  fruitVegNutPercent?: number;
}

export type RedFlagType =
  | "added_sugar"
  | "palm_oil"
  | "high_sodium"
  | "additives";

export interface RedFlag {
  type: RedFlagType;
  label: string;
  detail: string;
  severity: "warning" | "danger";
}

export interface Product {
  id: string; // barcode / EAN / UPC, used as canonical id
  barcode: string;
  name: string;
  brand: string;
  category?: string;
  imageUrl?: string;
  quantity?: string; // e.g. "70 g"
  servingSize?: string; // e.g. "1 pack (70 g)"
  servingSizeGrams?: number;
  ingredientsText?: string;
  additives?: string[]; // INS / E-number codes, e.g. ["E621", "E322"]
  nutrients: NutrientsPer100g;
  /** Grade as supplied directly by Open Food Facts, if present */
  sourceGrade?: NutriGrade;
  source: "openfoodfacts" | "mock";
  countryTags?: string[];
}

export interface ScoredProduct extends Product {
  grade: NutriGrade;
  gradeSource: "provided" | "calculated";
  points: {
    negative: number;
    positive: number;
    final: number;
  };
  redFlags: RedFlag[];
}

export type AppState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; product: ScoredProduct; alternatives: ScoredProduct[] }
  | { status: "not_found"; query: string }
  | { status: "error"; message: string };
