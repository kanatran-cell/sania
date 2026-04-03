import type {
  NutritionalInfo,
  ProductAnalysis,
  AnalysisResult,
  ScannedProduct,
} from "../types/product";

/**
 * Health scoring algorithm (0-100).
 * Based on OMS/WHO recommendations and NutriScore methodology.
 * Products already have nutritional data from Open Food Facts.
 */
function calculateHealthScore(info: NutritionalInfo): {
  score: number;
  pros: string[];
  cons: string[];
  warnings: string[];
} {
  let score = 70;
  const pros: string[] = [];
  const cons: string[] = [];
  const warnings: string[] = [];

  // === NEGATIVE FACTORS ===

  if (info.calories > 400) {
    score -= 15;
    cons.push(`Alto en calorias: ${info.calories} kcal`);
  } else if (info.calories > 250) {
    score -= 8;
    cons.push(`Calorias moderadas: ${info.calories} kcal`);
  } else if (info.calories > 0 && info.calories <= 100) {
    score += 5;
    pros.push(`Bajo en calorias: ${info.calories} kcal`);
  }

  if (info.sugars > 20) {
    score -= 20;
    warnings.push(`Muy alto en azucar: ${info.sugars}g por 100g`);
  } else if (info.sugars > 12) {
    score -= 14;
    cons.push(`Alto en azucar: ${info.sugars}g`);
  } else if (info.sugars > 5) {
    score -= 6;
    cons.push(`Azucar moderada: ${info.sugars}g`);
  } else if (info.sugars >= 0 && info.sugars <= 2 && info.calories > 0) {
    score += 5;
    pros.push(`Muy bajo en azucar: ${info.sugars}g`);
  }

  if (info.addedSugars > 10) {
    score -= 10;
    warnings.push(`Alto en azucares anadidos: ${info.addedSugars}g`);
  } else if (info.addedSugars > 5) {
    score -= 5;
    cons.push(`Contiene azucares anadidos: ${info.addedSugars}g`);
  }

  if (info.saturatedFat > 6) {
    score -= 15;
    warnings.push(`Alto en grasa saturada: ${info.saturatedFat}g`);
  } else if (info.saturatedFat > 3) {
    score -= 8;
    cons.push(`Grasa saturada moderada: ${info.saturatedFat}g`);
  } else if (info.saturatedFat >= 0 && info.saturatedFat <= 1 && info.calories > 0) {
    score += 3;
    pros.push(`Bajo en grasa saturada: ${info.saturatedFat}g`);
  }

  if (info.transFat > 0) {
    score -= 20;
    warnings.push(`Contiene grasas trans: ${info.transFat}g`);
  }

  if (info.sodium > 800) {
    score -= 15;
    warnings.push(`Muy alto en sodio: ${info.sodium}mg`);
  } else if (info.sodium > 400) {
    score -= 8;
    cons.push(`Sodio elevado: ${info.sodium}mg`);
  } else if (info.sodium > 0 && info.sodium <= 140) {
    score += 3;
    pros.push(`Bajo en sodio: ${info.sodium}mg`);
  }

  if (info.totalFat > 20) {
    score -= 10;
    cons.push(`Alto en grasa total: ${info.totalFat}g`);
  } else if (info.totalFat >= 0 && info.totalFat <= 3 && info.calories > 0) {
    score += 3;
    pros.push(`Bajo en grasas: ${info.totalFat}g`);
  }

  // === POSITIVE FACTORS ===

  if (info.fiber >= 5) {
    score += 10;
    pros.push(`Excelente fuente de fibra: ${info.fiber}g`);
  } else if (info.fiber >= 3) {
    score += 5;
    pros.push(`Buena fuente de fibra: ${info.fiber}g`);
  }

  if (info.protein >= 15) {
    score += 8;
    pros.push(`Alto en proteina: ${info.protein}g`);
  } else if (info.protein >= 7) {
    score += 4;
    pros.push(`Buena fuente de proteina: ${info.protein}g`);
  }

  // === ADDITIVES ===

  if (info.additives.length > 5) {
    score -= 12;
    warnings.push(`Contiene ${info.additives.length} aditivos`);
  } else if (info.additives.length > 2) {
    score -= 6;
    cons.push(`Contiene ${info.additives.length} aditivos`);
  } else if (info.additives.length === 0 && info.ingredients.length > 0) {
    score += 5;
    pros.push("Sin aditivos artificiales detectados");
  }

  if (info.ingredients.length > 15) {
    score -= 5;
    cons.push(`Muy procesado: ${info.ingredients.length} ingredientes`);
  } else if (info.ingredients.length > 0 && info.ingredients.length <= 5) {
    score += 5;
    pros.push(`Pocos ingredientes: ${info.ingredients.length}`);
  }

  score = Math.max(0, Math.min(100, score));
  return { score, pros, cons, warnings };
}

/**
 * Analyze products that already have nutritional data from Open Food Facts.
 */
export function analyzeProducts(products: ScannedProduct[]): AnalysisResult {
  const analyses: ProductAnalysis[] = products.map((product) => {
    const { score, pros, cons, warnings } = calculateHealthScore(product.nutritionalInfo);
    return {
      productId: product.id,
      name: product.name,
      brand: product.brand,
      nutritionalInfo: product.nutritionalInfo,
      healthScore: Math.round(score),
      pros,
      cons,
      warnings,
    };
  });

  analyses.sort((a, b) => b.healthScore - a.healthScore);

  const winner = analyses[0];
  const second = analyses[1];

  let summary = `${winner.name} es la opcion mas saludable con ${winner.healthScore}/100.`;

  if (second) {
    const diff = winner.healthScore - second.healthScore;
    if (diff === 0) {
      summary = `${winner.name} y ${second.name} tienen puntajes similares (${winner.healthScore}/100). Ambos son comparables.`;
    } else if (diff <= 10) {
      summary += ` Muy cercano a ${second.name} (${second.healthScore}/100).`;
    } else {
      summary += ` Supera a ${second.name} por ${diff} puntos.`;
    }
  }

  if (winner.pros.length > 0) {
    summary += ` Destaca por: ${winner.pros[0].toLowerCase()}.`;
  }

  return {
    products: analyses,
    winnerId: winner.productId,
    summary,
  };
}
