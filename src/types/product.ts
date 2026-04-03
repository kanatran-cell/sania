export interface ScannedProduct {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  imageUri?: string;
  imageUrl?: string;
  nutritionalInfo: NutritionalInfo;
  timestamp: number;
}

export interface NutrientValues {
  calories: number;
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  sodium: number;
  totalCarbs: number;
  sugars: number;
  addedSugars: number;
  fiber: number;
  protein: number;
}

export interface NutritionalInfo extends NutrientValues {
  productName: string;
  brand: string;
  servingSize: string;
  perServing: NutrientValues;
  ingredients: string[];
  additives: string[];
}

export interface IngredientAnalysis {
  totalCount: number;
  artificialSweeteners: string[];
  artificialColorants: string[];
  preservatives: string[];
  ultraProcessedMarkers: string[];
  flavorEnhancers: string[];
  hasAddedSugar: boolean;
  hasAddedWater: boolean;
  firstIngredient: string;
  classification: "natural" | "minimal" | "processed" | "ultra_processed";
  verdict: string;
}

export interface ProductAnalysis {
  productId: string;
  name: string;
  brand: string;
  nutritionalInfo: NutritionalInfo;
  healthScore: number;
  pros: string[];
  cons: string[];
  warnings: string[];
  ingredientAnalysis?: IngredientAnalysis;
}

export interface AnalysisResult {
  products: ProductAnalysis[];
  winnerId: string;
  summary: string;
}
