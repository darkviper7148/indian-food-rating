import type { NutrientsPer100g, Product, RedFlag } from "./types";

// WHO recommends <2g sodium/day (5g salt). A product is flagged "high
// sodium" if a typical serving alone would eat up a large share of that.
const WHO_DAILY_SODIUM_MG = 2000;
const HIGH_SODIUM_PER_100G_MG = 600; // OFF/FSSAI-aligned "high" threshold

const HIDDEN_SUGAR_TERMS = [
  "maltodextrin",
  "corn syrup",
  "high fructose corn syrup",
  "invert sugar",
  "glucose syrup",
  "dextrose",
  "fruit juice concentrate",
  "cane juice",
];

const PALM_OIL_TERMS = [
  "palm oil",
  "palmolein",
  "hydrogenated vegetable oil",
  "hydrogenated fat",
  "vanaspati",
  "interesterified fat",
];

// A short list of INS/E-numbers commonly flagged by consumer-advocacy
// sources in India (preservatives, artificial colors, flavor enhancers).
const WATCHLIST_ADDITIVES = new Set([
  "E102", "E110", "E122", "E124", "E129", // artificial colors
  "E211", "E212", "E220", "E223", // preservatives
  "E621", "E622", "E627", "E631", // flavor enhancers (MSG family)
  "E951", // aspartame
]);

export function detectRedFlags(product: Product): RedFlag[] {
  const flags: RedFlag[] = [];
  const ingredients = (product.ingredientsText ?? "").toLowerCase();
  const n: NutrientsPer100g = product.nutrients;

  // 1. Added / hidden sugar
  const hasHiddenSugarTerm = HIDDEN_SUGAR_TERMS.some((t) => ingredients.includes(t));
  if (hasHiddenSugarTerm || n.sugars >= 22.5) {
    flags.push({
      type: "added_sugar",
      label: hasHiddenSugarTerm ? "Hidden added sugars" : "High sugar content",
      detail: hasHiddenSugarTerm
        ? "Ingredient list includes sweeteners like maltodextrin, corn syrup, or invert sugar in addition to any listed sugar."
        : `Contains ${n.sugars.toFixed(1)}g sugar per 100g — above the 22.5g/100g "high sugar" threshold.`,
      severity: n.sugars >= 22.5 && hasHiddenSugarTerm ? "danger" : "warning",
    });
  }

  // 2. Palm oil / hydrogenated fats
  const palmTerm = PALM_OIL_TERMS.find((t) => ingredients.includes(t));
  if (palmTerm) {
    flags.push({
      type: "palm_oil",
      label: "Palm oil or hydrogenated fat",
      detail: `Ingredients mention "${palmTerm}" — linked to higher saturated fat intake; watch total saturated fat below.`,
      severity: n.saturatedFat >= 5 ? "danger" : "warning",
    });
  }

  // 3. High sodium vs WHO limits
  const sodiumMgPer100g = n.sodium * 1000;
  if (sodiumMgPer100g >= HIGH_SODIUM_PER_100G_MG) {
    const pctOfDailyPerServing = product.servingSizeGrams
      ? Math.round(
          ((sodiumMgPer100g * (product.servingSizeGrams / 100)) / WHO_DAILY_SODIUM_MG) * 100
        )
      : undefined;
    flags.push({
      type: "high_sodium",
      label: "High sodium / salt",
      detail:
        pctOfDailyPerServing !== undefined
          ? `${Math.round(sodiumMgPer100g)}mg sodium per 100g. One serving covers ~${pctOfDailyPerServing}% of the WHO daily limit (2000mg).`
          : `${Math.round(sodiumMgPer100g)}mg sodium per 100g — above the WHO-aligned 600mg/100g "high" threshold.`,
      severity: sodiumMgPer100g >= 900 ? "danger" : "warning",
    });
  }

  // 4. Additive load
  const flaggedAdditives = (product.additives ?? []).filter((code) =>
    WATCHLIST_ADDITIVES.has(code.toUpperCase())
  );
  const totalAdditives = product.additives?.length ?? 0;
  if (flaggedAdditives.length > 0 || totalAdditives >= 5) {
    flags.push({
      type: "additives",
      label: "Multiple chemical additives",
      detail:
        flaggedAdditives.length > 0
          ? `Contains watchlisted additives: ${flaggedAdditives.join(", ")}.`
          : `Contains ${totalAdditives} additives (E-numbers/INS codes) — a longer additive list generally signals a more processed product.`,
      severity: flaggedAdditives.length > 0 ? "danger" : "warning",
    });
  }

  return flags;
}
