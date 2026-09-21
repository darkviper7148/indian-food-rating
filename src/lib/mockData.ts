import type { Product } from "./types";

// Fallback dataset — used when Open Food Facts has no match or is
// unreachable. Nutrient values are representative approximations sourced
// from public pack labels, for demo purposes (not a certified database).
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "8901058851468",
    barcode: "8901058851468",
    name: "Maggi 2-Minute Noodles, Masala",
    brand: "Nestlé",
    category: "Instant Noodles",
    imageUrl:
      "https://images.openfoodfacts.org/images/products/890/105/885/1468/front_en.400.jpg",
    quantity: "70 g",
    servingSize: "1 pack (70 g)",
    servingSizeGrams: 70,
    ingredientsText:
      "Noodles (wheat flour, palm oil, salt), tastemaker (mixed spices, salt, sugar, maltodextrin, hydrolyzed groundnut protein, onion powder, garlic powder), acidity regulators (INS 501i, INS 296), flavor enhancer (E621), thickener (INS 508)",
    additives: ["E501", "E296", "E621", "E508"],
    nutrients: {
      energyKcal: 454,
      fat: 17.7,
      saturatedFat: 8.4,
      carbohydrates: 62.6,
      sugars: 3.9,
      fiber: 2.7,
      protein: 9.3,
      sodium: 1.08, // grams per 100g
      fruitVegNutPercent: 0,
    },
    source: "mock",
    countryTags: ["india"],
  },
  {
    id: "8901719100210",
    barcode: "8901719100210",
    name: "Aloo Bhujia",
    brand: "Haldiram's",
    category: "Savoury Snacks",
    imageUrl:
      "https://images.openfoodfacts.org/images/products/890/171/910/0210/front_en.400.jpg",
    quantity: "200 g",
    servingSize: "30 g",
    servingSizeGrams: 30,
    ingredientsText:
      "Gram flour, palmolein oil, potato, spices, salt, acidity regulator (E330), antioxidant (E319)",
    additives: ["E330", "E319"],
    nutrients: {
      energyKcal: 536,
      fat: 34.5,
      saturatedFat: 15.2,
      carbohydrates: 45.6,
      sugars: 2.1,
      fiber: 5.8,
      protein: 13.2,
      sodium: 0.98,
      fruitVegNutPercent: 5,
    },
    source: "mock",
    countryTags: ["india"],
  },
  {
    id: "8901262110014",
    barcode: "8901262110014",
    name: "Amul Butter, Pasteurised",
    brand: "Amul",
    category: "Dairy Spreads",
    imageUrl:
      "https://images.openfoodfacts.org/images/products/890/126/211/0014/front_en.400.jpg",
    quantity: "500 g",
    servingSize: "10 g",
    servingSizeGrams: 10,
    ingredientsText: "Milk fat, salt (1.5%), permitted natural colour (annatto)",
    additives: [],
    nutrients: {
      energyKcal: 717,
      fat: 80,
      saturatedFat: 52,
      carbohydrates: 0.1,
      sugars: 0.1,
      fiber: 0,
      protein: 0.5,
      sodium: 0.59,
      fruitVegNutPercent: 0,
    },
    source: "mock",
    countryTags: ["india"],
  },
  {
    id: "8901491101115",
    barcode: "8901491101115",
    name: "Parle-G Original Glucose Biscuits",
    brand: "Parle",
    category: "Biscuits",
    imageUrl:
      "https://images.openfoodfacts.org/images/products/890/149/110/1115/front_en.400.jpg",
    quantity: "100 g",
    servingSize: "4 biscuits (24 g)",
    servingSizeGrams: 24,
    ingredientsText:
      "Wheat flour, sugar, edible vegetable oil (palm oil), invert sugar syrup, leavening agents (E503, E500), salt, milk solids, emulsifiers (E322, E471)",
    additives: ["E503", "E500", "E322", "E471"],
    nutrients: {
      energyKcal: 462,
      fat: 14.6,
      saturatedFat: 7.1,
      carbohydrates: 76.7,
      sugars: 28.9,
      fiber: 1.6,
      protein: 6.9,
      sodium: 0.35,
      fruitVegNutPercent: 0,
    },
    source: "mock",
    countryTags: ["india"],
  },
  {
    id: "8901063052103",
    barcode: "8901063052103",
    name: "Chana Dal Namkeen, Roasted",
    brand: "Haldiram's",
    category: "Savoury Snacks",
    imageUrl:
      "https://images.openfoodfacts.org/images/products/890/106/305/2103/front_en.400.jpg",
    quantity: "180 g",
    servingSize: "30 g",
    servingSizeGrams: 30,
    ingredientsText: "Roasted chana dal, edible oil, salt, spices",
    additives: [],
    nutrients: {
      energyKcal: 380,
      fat: 9.8,
      saturatedFat: 1.4,
      carbohydrates: 55.2,
      sugars: 1.8,
      fiber: 11.5,
      protein: 18.4,
      sodium: 0.52,
      fruitVegNutPercent: 10,
    },
    source: "mock",
    countryTags: ["india"],
  },
  {
    id: "8901030826656",
    barcode: "8901030826656",
    name: "Diet Coke",
    brand: "Coca-Cola",
    category: "Carbonated Beverages",
    imageUrl:
      "https://images.openfoodfacts.org/images/products/890/103/082/6656/front_en.400.jpg",
    quantity: "300 ml",
    servingSize: "300 ml can",
    servingSizeGrams: 300,
    ingredientsText:
      "Carbonated water, acidity regulator (E338), sweeteners (E951, E950), caramel colour (E150d), preservative (E211), caffeine",
    additives: ["E338", "E951", "E950", "E150d", "E211"],
    nutrients: {
      energyKcal: 0.4,
      fat: 0,
      saturatedFat: 0,
      carbohydrates: 0,
      sugars: 0,
      fiber: 0,
      protein: 0,
      sodium: 0.02,
      fruitVegNutPercent: 0,
    },
    source: "mock",
    countryTags: ["india"],
  },
];

export function searchMockProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.barcode === q
  );
}

export function findMockProductByBarcode(barcode: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.barcode === barcode);
}
