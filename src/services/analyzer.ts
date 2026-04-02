import type {
  NutritionalInfo,
  ProductAnalysis,
  AnalysisResult,
  ScannedProduct,
} from "../types/product";
import { recognizeText } from "./ocr";
import { parseNutritionalLabel } from "./parser";

/**
 * Health scoring algorithm (0-100).
 * Based on nutritional science guidelines:
 * - OMS/WHO recommendations for sugar, sodium, fat
 * - NutriScore methodology (adapted)
 */
function calculateHealthScore(info: NutritionalInfo): {
  score: number;
  pros: string[];
  cons: string[];
  warnings: string[];
} {
  let score = 70; // Start at a neutral-good baseline
  const pros: string[] = [];
  const cons: string[] = [];
  const warnings: string[] = [];

  // === NEGATIVE FACTORS (subtract points) ===

  // Calories per serving (reference: 2000 kcal/day)
  if (info.calories > 400) {
    score -= 15;
    cons.push(`Alto en calorías: ${info.calories} kcal`);
  } else if (info.calories > 250) {
    score -= 8;
    cons.push(`Calorías moderadas: ${info.calories} kcal`);
  } else if (info.calories <= 100) {
    score += 5;
    pros.push(`Bajo en calorías: ${info.calories} kcal`);
  }

  // Sugars (WHO recommends <25g/day added sugars)
  if (info.sugars > 20) {
    score -= 20;
    warnings.push(`Muy alto en azúcar: ${info.sugars}g por porción`);
  } else if (info.sugars > 12) {
    score -= 14;
    cons.push(`Alto en azúcar: ${info.sugars}g`);
  } else if (info.sugars > 5) {
    score -= 6;
    cons.push(`Azúcar moderada: ${info.sugars}g`);
  } else if (info.sugars <= 2) {
    score += 5;
    pros.push(`Muy bajo en azúcar: ${info.sugars}g`);
  }

  // Added sugars
  if (info.addedSugars > 10) {
    score -= 10;
    warnings.push(`Alto en azúcares añadidos: ${info.addedSugars}g`);
  } else if (info.addedSugars > 5) {
    score -= 5;
    cons.push(`Contiene azúcares añadidos: ${info.addedSugars}g`);
  }

  // Saturated fat (WHO recommends <10% of energy intake)
  if (info.saturatedFat > 6) {
    score -= 15;
    warnings.push(`Alto en grasa saturada: ${info.saturatedFat}g`);
  } else if (info.saturatedFat > 3) {
    score -= 8;
    cons.push(`Grasa saturada moderada: ${info.saturatedFat}g`);
  } else if (info.saturatedFat <= 1) {
    score += 3;
    pros.push(`Bajo en grasa saturada: ${info.saturatedFat}g`);
  }

  // Trans fat (should be 0)
  if (info.transFat > 0) {
    score -= 20;
    warnings.push(
      `Contiene grasas trans: ${info.transFat}g — evitar por completo`
    );
  }

  // Sodium (WHO recommends <2000mg/day, ~600mg per meal)
  if (info.sodium > 800) {
    score -= 15;
    warnings.push(`Muy alto en sodio: ${info.sodium}mg`);
  } else if (info.sodium > 400) {
    score -= 8;
    cons.push(`Sodio elevado: ${info.sodium}mg`);
  } else if (info.sodium <= 140) {
    score += 3;
    pros.push(`Bajo en sodio: ${info.sodium}mg`);
  }

  // Total fat
  if (info.totalFat > 20) {
    score -= 10;
    cons.push(`Alto en grasa total: ${info.totalFat}g`);
  } else if (info.totalFat <= 3) {
    score += 3;
    pros.push(`Bajo en grasas: ${info.totalFat}g`);
  }

  // === POSITIVE FACTORS (add points) ===

  // Fiber (goal: >25g/day)
  if (info.fiber >= 5) {
    score += 10;
    pros.push(`Excelente fuente de fibra: ${info.fiber}g`);
  } else if (info.fiber >= 3) {
    score += 5;
    pros.push(`Buena fuente de fibra: ${info.fiber}g`);
  }

  // Protein
  if (info.protein >= 15) {
    score += 8;
    pros.push(`Alto en proteína: ${info.protein}g`);
  } else if (info.protein >= 7) {
    score += 4;
    pros.push(`Buena fuente de proteína: ${info.protein}g`);
  }

  // === ADDITIVES (subtract points) ===
  if (info.additives.length > 5) {
    score -= 12;
    warnings.push(`Contiene ${info.additives.length} aditivos detectados`);
  } else if (info.additives.length > 2) {
    score -= 6;
    cons.push(`Contiene ${info.additives.length} aditivos`);
  } else if (info.additives.length === 0 && info.ingredients.length > 0) {
    score += 5;
    pros.push("Sin aditivos artificiales detectados");
  }

  // Ingredient count (less = generally less processed)
  if (info.ingredients.length > 15) {
    score -= 5;
    cons.push(`Muy procesado: ${info.ingredients.length} ingredientes`);
  } else if (info.ingredients.length > 0 && info.ingredients.length <= 5) {
    score += 5;
    pros.push(`Pocos ingredientes: ${info.ingredients.length}`);
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return { score, pros, cons, warnings };
}

/**
 * Main analysis function: OCR + parse + score for all products.
 * Runs entirely on-device, no internet needed.
 */
export async function analyzeProducts(
  products: ScannedProduct[]
): Promise<AnalysisResult> {
  const analyses: ProductAnalysis[] = [];

  for (const product of products) {
    const rawText = await recognizeText(product.imageUri);
    const nutritionalInfo = parseNutritionalLabel(rawText);
    const { score, pros, cons, warnings } =
      calculateHealthScore(nutritionalInfo);

    analyses.push({
      productId: product.id,
      name: nutritionalInfo.productName,
      brand: nutritionalInfo.brand,
      nutritionalInfo,
      healthScore: Math.round(score),
      pros,
      cons,
      warnings,
    });
  }

  // Sort by health score descending
  analyses.sort((a, b) => b.healthScore - a.healthScore);

  const winner = analyses[0];
  const second = analyses[1];

  // Build summary
  let summary = `${winner.name} es la opción más saludable con un puntaje de ${winner.healthScore}/100.`;

  if (second) {
    const diff = winner.healthScore - second.healthScore;
    if (diff === 0) {
      summary = `${winner.name} y ${second.name} tienen puntajes similares (${winner.healthScore}/100). Ambos son opciones comparables.`;
    } else if (diff <= 10) {
      summary += ` Muy cercano a ${second.name} (${second.healthScore}/100).`;
    } else {
      summary += ` Supera a ${second.name} por ${diff} puntos.`;
    }
  }

  // Add key differentiator
  if (winner.pros.length > 0) {
    summary += ` Destaca por: ${winner.pros[0].toLowerCase()}.`;
  }

  return {
    products: analyses,
    winnerId: winner.productId,
    summary,
  };
}
