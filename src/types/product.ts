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

export interface ProductAnalysis {
  productId: string;
  name: string;
  brand: string;
  nutritionalInfo: NutritionalInfo;
  healthScore: number;
  pros: string[];
  cons: string[];
  warnings: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ingredientAnalysis?: any;
}

export interface AnalysisResult {
  products: ProductAnalysis[];
  winnerId: string;
  summary: string;
}
