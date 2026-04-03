import type { NutritionalInfo, NutrientValues } from "../types/product";

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

  const name = extractName(p);
  const brand = p.brands || "Marca desconocida";

  console.log("[SanIA] Found product:", name, "by", brand);

  // Values per 100g (used for health scoring / comparison)
  const per100g: NutrientValues = {
    calories: Math.round(n["energy-kcal_100g"] || (n["energy_100g"] ? n["energy_100g"] / 4.184 : 0)),
    totalFat: round(n["fat_100g"] || 0),
    saturatedFat: round(n["saturated-fat_100g"] || 0),
    transFat: round(n["trans-fat_100g"] || 0),
    sodium: Math.round((n["sodium_100g"] || 0) * 1000),
    totalCarbs: round(n["carbohydrates_100g"] || 0),
    sugars: round(n["sugars_100g"] || 0),
    addedSugars: round(n["added-sugars_100g"] || 0),
    fiber: round(n["fiber_100g"] || 0),
    protein: round(n["proteins_100g"] || 0),
  };

  // Values per serving (used for display, matches the product label)
  const perServing: NutrientValues = {
    calories: Math.round(n["energy-kcal_serving"] || (n["energy_serving"] ? n["energy_serving"] / 4.184 : 0)),
    totalFat: round(n["fat_serving"] || 0),
    saturatedFat: round(n["saturated-fat_serving"] || 0),
    transFat: round(n["trans-fat_serving"] || 0),
    sodium: Math.round((n["sodium_serving"] || 0) * 1000),
    totalCarbs: round(n["carbohydrates_serving"] || 0),
    sugars: round(n["sugars_serving"] || 0),
    addedSugars: round(n["added-sugars_serving"] || 0),
    fiber: round(n["fiber_serving"] || 0),
    protein: round(n["proteins_serving"] || 0),
  };

  return {
    found: true,
    name,
    brand,
    imageUrl: p.image_front_url || p.image_url || undefined,
    nutritionalInfo: {
      productName: name,
      brand,
      servingSize: p.serving_size || p.quantity || "No especificado",
      ...per100g,
      perServing,
      ingredients: extractIngredients(p),
      additives: extractAdditives(p),
    },
  };
}

export interface SearchResult {
  barcode: string;
  name: string;
  brand: string;
  imageUrl?: string;
}

export async function searchProducts(query: string): Promise<SearchResult[]> {
  console.log("[SanIA] Searching products:", query);

  const url = `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=true&page_size=10&fields=code,product_name,brands,image_front_small_url`;
  console.log("[SanIA] Search URL:", url);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "SanIA/1.0 (Android; contact: kanatran@gmail.com)",
    },
  });

  console.log("[SanIA] Search response status:", response.status);

  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`);
  }

  const text = await response.text();
  console.log("[SanIA] Search response length:", text.length);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.warn("[SanIA] Failed to parse search response:", text.substring(0, 200));
    throw new Error("Invalid response from server");
  }

  if (!data.products || data.products.length === 0) return [];

  return data.products
    .filter((p: Record<string, unknown>) => p.product_name && p.code)
    .map((p: Record<string, unknown>) => ({
      barcode: p.code as string,
      name: (p.product_name || "Producto") as string,
      brand: (p.brands || "") as string,
      imageUrl: (p.image_front_small_url || undefined) as string | undefined,
    }));
}

function round(val: number): number {
  return Math.round(val * 10) / 10;
}

function extractIngredients(product: Record<string, unknown>): string[] {
  // Prefer Spanish, then any language available
  const text = (
    product.ingredients_text_es ||
    product.ingredients_text_with_allergens_es ||
    product.ingredients_text ||
    product.ingredients_text_with_allergens ||
    ""
  ) as string;
  if (!text) return [];
  return text
    .replace(/_/g, "")
    .split(/[,;]/)
    .map((i) => i.trim().replace(/^\d+[.)\s]+/, ""))
    .filter((i) => i.length > 1 && i.length < 80)
    .slice(0, 30);
}

function extractName(product: Record<string, unknown>): string {
  return (
    (product.product_name_es as string) ||
    (product.product_name as string) ||
    "Producto"
  );
}

function extractAdditives(product: Record<string, unknown>): string[] {
  const tags = product.additives_tags as string[] | undefined;
  if (!tags || !Array.isArray(tags)) return [];
  return tags.map((t) => t.replace("en:", "").replace(/-/g, " ").toUpperCase()).slice(0, 15);
}

function emptyNutrition(): NutritionalInfo {
  const empty: NutrientValues = {
    calories: 0, totalFat: 0, saturatedFat: 0, transFat: 0,
    sodium: 0, totalCarbs: 0, sugars: 0, addedSugars: 0, fiber: 0, protein: 0,
  };
  return {
    productName: "Producto no encontrado",
    brand: "Desconocido",
    servingSize: "No especificado",
    ...empty,
    perServing: empty,
    ingredients: [],
    additives: [],
  };
}
