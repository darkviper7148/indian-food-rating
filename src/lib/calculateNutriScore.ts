import type { NutrientsPer100g, NutriGrade } from "./types";

/**
 * Simplified implementation of the Nutri-Score algorithm (2017 "classic"
 * general-foods table), as published by Santé publique France / used by
 * Open Food Facts before the 2023 revision.
 *
 * NOTE ON SCOPE: The official algorithm has *separate* point tables for
 * beverages, cheeses, and added fats (oils/butter/margarine). This engine
 * implements the general-foods table, which is correct for the large
 * majority of packaged snacks, staples, and ready-to-eat items this app
 * targets. It is a fallback used only when Open Food Facts hasn't already
 * supplied a `nutriscore_grade` — always prefer the source grade when present.
 */

// ---- Negative component point tables (0-10 each) --------------------------

function pointsForEnergyKJ(energyKJ: number): number {
  const thresholds = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
  return scoreAgainstThresholds(energyKJ, thresholds);
}

function pointsForSaturatedFat(gramsPer100g: number): number {
  const thresholds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return scoreAgainstThresholds(gramsPer100g, thresholds);
}

function pointsForSugars(gramsPer100g: number): number {
  const thresholds = [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45];
  return scoreAgainstThresholds(gramsPer100g, thresholds);
}

function pointsForSodium(mgPer100g: number): number {
  const thresholds = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900];
  return scoreAgainstThresholds(mgPer100g, thresholds);
}

// ---- Positive component point tables ---------------------------------------

function pointsForFiber(gramsPer100g: number): number {
  const thresholds = [0.9, 1.9, 2.8, 3.7, 4.7]; // 0-5 points
  return scoreAgainstThresholds(gramsPer100g, thresholds);
}

function pointsForProtein(gramsPer100g: number): number {
  const thresholds = [1.6, 3.2, 4.8, 6.4, 8.0]; // 0-5 points
  return scoreAgainstThresholds(gramsPer100g, thresholds);
}

function pointsForFruitVegNut(percent: number): number {
  // Non-linear official table: 0, 1, 2, then jumps straight to 5.
  if (percent > 80) return 5;
  if (percent > 60) return 2;
  if (percent > 40) return 1;
  return 0;
}

function scoreAgainstThresholds(value: number, thresholds: number[]): number {
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return i;
  }
  return thresholds.length;
}

// ---- Final letter grade mapping --------------------------------------------

function gradeFromFinalScore(score: number): NutriGrade {
  if (score <= -1) return "a";
  if (score <= 2) return "b";
  if (score <= 10) return "c";
  if (score <= 18) return "d";
  return "e";
}

export interface NutriScoreResult {
  grade: NutriGrade;
  negativePoints: number;
  positivePoints: number;
  finalScore: number;
}

/**
 * Calculates the Nutri-Score A-E grade from per-100g/ml nutrient values.
 * Sodium is expected in grams (this app's internal unit); OFF frequently
 * reports salt in grams — convert with `salt / 2.5` before calling this,
 * which `foodService.ts` already does when normalizing raw OFF payloads.
 */
export function calculateNutriScore(nutrients: NutrientsPer100g): NutriScoreResult {
  const energyKJ = nutrients.energyKcal * 4.184;
  const sodiumMg = nutrients.sodium * 1000;

  const energyPts = pointsForEnergyKJ(energyKJ);
  const satFatPts = pointsForSaturatedFat(nutrients.saturatedFat);
  const sugarPts = pointsForSugars(nutrients.sugars);
  const sodiumPts = pointsForSodium(sodiumMg);
  const negativePoints = energyPts + satFatPts + sugarPts + sodiumPts;

  const fruitVegPts = pointsForFruitVegNut(nutrients.fruitVegNutPercent ?? 0);
  const fiberPts = pointsForFiber(nutrients.fiber);

  // Official rule: protein only counts toward positive points unless
  // negative points are high (>=11) AND fruit/veg/nut points are below max (<5) —
  // in that specific case protein is excluded, to stop protein-heavy but
  // otherwise poor-quality products (e.g. some processed meats) from scoring well.
  const proteinCounts = negativePoints < 11 || fruitVegPts === 5;
  const proteinPts = proteinCounts ? pointsForProtein(nutrients.protein) : 0;

  const positivePoints = fruitVegPts + fiberPts + proteinPts;
  const finalScore = negativePoints - positivePoints;

  return {
    grade: gradeFromFinalScore(finalScore),
    negativePoints,
    positivePoints,
    finalScore,
  };
}

export const GRADE_LABEL: Record<NutriGrade, string> = {
  a: "Excellent nutritional quality",
  b: "Good nutritional quality",
  c: "Average nutritional quality",
  d: "Poor nutritional quality",
  e: "Bad nutritional quality",
};

export const GRADE_HEX: Record<NutriGrade, string> = {
  a: "#268A4E",
  b: "#7FB93E",
  c: "#E8B923",
  d: "#E8792B",
  e: "#D6432F",
};
