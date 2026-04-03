import type { NutritionalInfo } from "../types/product";

const BASE_URL = "https://world.openfoodfacts.org/api/v0/product";

export interface ProductLookupResult {
  found: boolean;
  name: string;
  brand: string;
  imageUrl?: string;
  nutritionalInfo: NutritionalInfo;
}

export async function lookupBarcode(barcode: string): Promise<ProductLookupResult> {
  console.log("[SanIA] Looking up barcode:", barcode);

  const response = await fetch(`${BASE_URL}/${barcode}.json`);
  const data = await response.json();

  if (data.status !== 1 || !data.product) {
    console.log("[SanIA] Product not found for barcode:", barcode);
    return {
      found: false,
      name: "Producto no encontrado",
      brand: "Desconocido",
      nutritionalInfo: emptyNutrition(),
    };
  }

  const p = data.product;
  const n = p.nutriments || {};

  console.log("[SanIA] Found product:", p.product_name, "by", p.brands);
  console.log("[SanIA] Nutriments:", JSON.stringify(n).substring(0, 300));

  return {
    found: true,
    name: p.product_name || p.product_name_es || "Producto",
    brand: p.brands || "Marca desconocida",
    imageUrl: p.image_front_url || p.image_url || undefined,
    nutritionalInfo: {
      productName: p.product_name || p.product_name_es || "Producto",
      brand: p.brands || "Marca desconocida",
      servingSize: p.serving_size || p.quantity || "No especificado",
      calories: Math.round(n["energy-kcal_100g"] || n["energy-kcal_serving"] || n["energy_100g"] / 4.184 || 0),
      totalFat: round(n["fat_100g"] || 0),
      saturatedFat: round(n["saturated-fat_100g"] || 0),
      transFat: round(n["trans-fat_100g"] || 0),
      sodium: Math.round((n["sodium_100g"] || 0) * 1000), // API gives grams, convert to mg
      totalCarbs: round(n["carbohydrates_100g"] || 0),
      sugars: round(n["sugars_100g"] || 0),
      addedSugars: round(n["added-sugars_100g"] || 0),
      fiber: round(n["fiber_100g"] || 0),
      protein: round(n["proteins_100g"] || 0),
      ingredients: extractIngredients(p),
      additives: extractAdditives(p),
    },
  };
}

function round(val: number): number {
  return Math.round(val * 10) / 10;
}

function extractIngredients(product: Record<string, unknown>): string[] {
  const text = (product.ingredients_text_es || product.ingredients_text || "") as string;
  if (!text) return [];
  return text
    .split(/[,;]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 1 && i.length < 80)
    .slice(0, 30);
}

function extractAdditives(product: Record<string, unknown>): string[] {
  const tags = product.additives_tags as string[] | undefined;
  if (!tags || !Array.isArray(tags)) return [];
  return tags.map((t) => t.replace("en:", "").replace(/-/g, " ").toUpperCase()).slice(0, 15);
}

function emptyNutrition(): NutritionalInfo {
  return {
    productName: "Producto no encontrado",
    brand: "Desconocido",
    servingSize: "No especificado",
    calories: 0,
    totalFat: 0,
    saturatedFat: 0,
    transFat: 0,
    sodium: 0,
    totalCarbs: 0,
    sugars: 0,
    addedSugars: 0,
    fiber: 0,
    protein: 0,
    ingredients: [],
    additives: [],
  };
}
