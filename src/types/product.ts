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

export interface NutritionalInfo {
  productName: string;
  brand: string;
  servingSize: string;
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
}

export interface AnalysisResult {
  products: ProductAnalysis[];
  winnerId: string;
  summary: string;
}
