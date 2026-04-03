import type {
  ProductAnalysis,
  AnalysisResult,
  ScannedProduct,
  NutritionalInfo,
} from "../types/product";
import {
  findHarmfulIngredients,
  HarmfulMatch,
} from "../constants/harmfulIngredients";

// === INGREDIENT ANALYSIS ===

export interface IngredientAnalysis {
  totalCount: number;
  harmfulMatches: HarmfulMatch[];
  level1Count: number;
  level2Count: number;
  level3Count: number;
  hasAddedSugar: boolean;
  hasAddedWater: boolean;
  classification: "natural" | "minimal" | "processed" | "ultra_processed";
  verdict: string;
}

function analyzeIngredients(info: NutritionalInfo): IngredientAnalysis {
  const ingredients = info.ingredients;
  const combined = ingredients.join(" ").toLowerCase();

  // Find harmful ingredients using the database
  const harmfulMatches = findHarmfulIngredients(ingredients, info.additives);
  const level1Count = harmfulMatches.filter((m) => m.ingredient.level === 1).length;
  const level2Count = harmfulMatches.filter((m) => m.ingredient.level === 2).length;
  const level3Count = harmfulMatches.filter((m) => m.ingredient.level === 3).length;

  const sugarWords = ["azucar", "azúcar", "sugar", "sacarosa", "fructosa", "jarabe", "syrup", "miel"];
  const hasAddedSugar = sugarWords.some((w) => combined.includes(w));

  const hasAddedWater = ingredients.length > 0 &&
    ["agua", "water"].some((w) => ingredients[0].toLowerCase().includes(w));

  // Classification
  const additivesCount = info.additives.length;
  const totalBad = level1Count + level2Count + additivesCount;
  let classification: IngredientAnalysis["classification"];
  let verdict: string;

  if (ingredients.length === 0 && additivesCount > 3) {
    classification = "ultra_processed";
    verdict = "Ultra-procesado.";
  } else if (ingredients.length === 0 && additivesCount > 0) {
    classification = "ultra_processed";
    verdict = "Sin ingredientes detallados. Contiene aditivos.";
  } else if (ingredients.length === 0) {
    classification = "ultra_processed";
    verdict = "Sin informacion de ingredientes. No se puede verificar que es seguro.";
  } else if (level1Count > 0) {
    // Any level 1 ingredient = ultra processed
    classification = "ultra_processed";
    const dangers = harmfulMatches
      .filter((m) => m.ingredient.level === 1)
      .map((m) => m.ingredient.category.toLowerCase());
    if (hasAddedWater && hasAddedSugar) {
      verdict = `Ultra-procesado. Basicamente agua con azucar y quimicos. Contiene ${[...new Set(dangers)].join(", ")}.`;
    } else {
      verdict = `Ultra-procesado. Contiene ingredientes peligrosos: ${[...new Set(dangers)].join(", ")}.`;
    }
  } else if (level2Count >= 2 || totalBad > 4) {
    classification = "ultra_processed";
    const concerns = harmfulMatches
      .filter((m) => m.ingredient.level <= 2)
      .map((m) => m.ingredient.category.toLowerCase());
    verdict = `Ultra-procesado. Contiene: ${[...new Set(concerns)].join(", ")}.`;
  } else if (level2Count > 0 || level3Count > 2) {
    classification = "processed";
    const issues = harmfulMatches
      .map((m) => m.ingredient.category.toLowerCase());
    if (hasAddedSugar) issues.push("azucar añadida");
    verdict = `Procesado. Contiene ${[...new Set(issues)].join(", ")}.`;
  } else if (hasAddedSugar || level3Count > 0) {
    classification = "minimal";
    const notes: string[] = [];
    if (hasAddedSugar) notes.push("azucar añadida");
    if (hasAddedWater) notes.push("agua añadida");
    if (level3Count > 0) notes.push("algunos aditivos");
    verdict = notes.length > 0
      ? `Minimamente procesado, pero contiene ${notes.join(" y ")}.`
      : "Minimamente procesado.";
  } else {
    classification = "natural";
    verdict = `100% natural. Solo contiene: ${ingredients.slice(0, 4).join(", ")}. Sin aditivos ni quimicos.`;
  }

  return {
    totalCount: ingredients.length,
    harmfulMatches,
    level1Count,
    level2Count,
    level3Count,
    hasAddedSugar,
    hasAddedWater,
    classification,
    verdict,
  };
}

// === HEALTH SCORING ===

function calculateHealthScore(info: NutritionalInfo): {
  score: number;
  pros: string[];
  cons: string[];
  warnings: string[];
  ingredientAnalysis: IngredientAnalysis;
} {
  const ia = analyzeIngredients(info);
  const pros: string[] = [];
  const cons: string[] = [];
  const warnings: string[] = [];

  // Base score by classification
  let score: number;
  switch (ia.classification) {
    case "natural":
      score = 95;
      pros.push("100% natural");
      break;
    case "minimal":
      score = 75;
      pros.push("Minimamente procesado");
      break;
    case "processed":
      score = 50;
      cons.push("Producto procesado");
      break;
    case "ultra_processed":
      score = 20;
      warnings.push("Ultra-procesado");
      break;
  }

  // === PENALTIES BY TOXICITY LEVEL ===

  // Level 1: -20 per ingredient (dangerous)
  for (const match of ia.harmfulMatches.filter((m) => m.ingredient.level === 1)) {
    score -= 20;
    warnings.push(`${match.ingredient.category}: ${match.ingredient.reason}`);
  }

  // Level 2: -10 per ingredient (concerning)
  for (const match of ia.harmfulMatches.filter((m) => m.ingredient.level === 2)) {
    score -= 10;
    cons.push(`${match.ingredient.category}: ${match.ingredient.reason}`);
  }

  // Level 3: -3 per ingredient (mild)
  for (const match of ia.harmfulMatches.filter((m) => m.ingredient.level === 3)) {
    score -= 3;
  }

  // Additives penalty from Open Food Facts
  if (info.additives.length > 5) {
    score -= 10;
  } else if (info.additives.length > 2) {
    score -= 5;
  }

  if (ia.hasAddedSugar) {
    score -= 8;
    cons.push("Contiene azucar añadida");
  }

  if (ia.hasAddedWater && ia.hasAddedSugar) {
    score -= 5;
  }

  // === NUTRITIONAL BONUSES (secondary) ===

  if (info.sugars > 15) score -= 5;
  if (info.fiber >= 3) {
    score += 3;
    pros.push(`Buena fuente de fibra: ${info.fiber}g`);
  }
  if (info.protein >= 7) {
    score += 3;
    pros.push(`Buena fuente de proteina: ${info.protein}g`);
  }
  if (info.transFat > 0) {
    score -= 10;
  }

  // === POSITIVE SIGNALS ===

  if (ia.harmfulMatches.length === 0 && ia.totalCount > 0 && info.additives.length === 0) {
    pros.push("Sin ingredientes nocivos detectados");
  }

  score = Math.max(0, Math.min(100, score));
  return { score, pros, cons, warnings, ingredientAnalysis: ia };
}

// === MAIN ANALYSIS ===

export function analyzeProducts(products: ScannedProduct[]): AnalysisResult {
  const analyses: ProductAnalysis[] = products.map((product) => {
    console.log(`[SanIA Analyzer] Product: ${product.name}`);
    console.log(`[SanIA Analyzer] Ingredients (${product.nutritionalInfo.ingredients.length}):`, product.nutritionalInfo.ingredients.slice(0, 10));
    console.log(`[SanIA Analyzer] Additives (${product.nutritionalInfo.additives.length}):`, product.nutritionalInfo.additives.slice(0, 10));

    const { score, pros, cons, warnings, ingredientAnalysis } =
      calculateHealthScore(product.nutritionalInfo);

    console.log(`[SanIA Analyzer] Score: ${score}, Classification: ${ingredientAnalysis.classification}`);
    console.log(`[SanIA Analyzer] Harmful matches: ${ingredientAnalysis.harmfulMatches.length} (L1:${ingredientAnalysis.level1Count} L2:${ingredientAnalysis.level2Count} L3:${ingredientAnalysis.level3Count})`);

    return {
      productId: product.id,
      name: product.name,
      brand: product.brand,
      nutritionalInfo: product.nutritionalInfo,
      healthScore: Math.round(score),
      pros,
      cons,
      warnings,
      ingredientAnalysis,
    };
  });

  analyses.sort((a, b) => b.healthScore - a.healthScore);
  const winner = analyses[0];

  return {
    products: analyses,
    winnerId: winner.productId,
    summary: winner.ingredientAnalysis?.verdict || "",
  };
}
