import type {
  ProductAnalysis,
  AnalysisResult,
  ScannedProduct,
  NutritionalInfo,
} from "../types/product";

// === INGREDIENT CLASSIFICATION ===

const ARTIFICIAL_SWEETENERS = [
  "aspartame", "aspartamo", "acesulfame", "acesulfamo", "acesulfame k",
  "sucralosa", "sucralose", "sacarina", "saccharin", "ciclamato",
  "neotame", "neotamo", "advantame",
];

const ARTIFICIAL_COLORANTS = [
  "colorante", "color artificial", "colour",
  "tartrazina", "tartrazine", "amarillo 5", "yellow 5",
  "amarillo 6", "yellow 6", "amarillo ocaso", "sunset yellow",
  "rojo 40", "red 40", "rojo allura", "allura red",
  "azul 1", "blue 1", "azul 2", "blue 2", "azul brillante",
  "caramelo", "dioxido de titanio", "titanium dioxide",
  "e102", "e104", "e110", "e120", "e122", "e124", "e127", "e129",
  "e131", "e132", "e133", "e142", "e150", "e151", "e155", "e171",
];

const PRESERVATIVES = [
  "benzoato", "benzoate", "sorbato", "sorbate",
  "nitrito", "nitrite", "nitrato", "nitrate",
  "sulfito", "sulfite", "bisulfito",
  "propionato", "propionate",
  "e200", "e202", "e210", "e211", "e212", "e213",
  "e220", "e221", "e222", "e223", "e224",
  "e249", "e250", "e251", "e252",
  "e280", "e281", "e282", "e283",
];

const ULTRA_PROCESSED_MARKERS = [
  "maltodextrina", "maltodextrin",
  "jarabe de maiz", "jarabe de maíz", "high fructose corn syrup", "hfcs",
  "jarabe de glucosa", "glucose syrup",
  "aceite vegetal hidrogenado", "hydrogenated", "parcialmente hidrogenado",
  "proteina hidrolizada", "hydrolyzed protein",
  "almidón modificado", "modified starch",
  "isolate", "aislado",
  "dextrosa", "dextrose",
  "polidextrosa", "polydextrose",
  "carboximetilcelulosa", "goma xantana", "xanthan",
  "polisorbato", "polysorbate",
  "mono y digliceridos", "monoglyceride", "diglyceride",
  "lecitina de soya", "soy lecithin",
];

const FLAVOR_ENHANCERS = [
  "glutamato", "glutamate", "msg", "glutamato monosodico",
  "inosinato", "inosinate", "guanilato", "guanylate",
  "e621", "e627", "e631", "e635",
  "saborizante", "saborizante artificial", "flavoring", "artificial flavor",
  "extracto de levadura", "yeast extract",
  "aroma", "aroma artificial", "aroma idéntico al natural",
];

interface IngredientAnalysis {
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

function analyzeIngredients(info: NutritionalInfo): IngredientAnalysis {
  const ingredients = info.ingredients;
  const allText = ingredients.join(" ").toLowerCase();
  const additives = info.additives.map((a) => a.toLowerCase());
  const combined = allText + " " + additives.join(" ");

  const findMatches = (list: string[]): string[] => {
    const found: string[] = [];
    for (const item of list) {
      if (combined.includes(item.toLowerCase())) {
        found.push(item);
      }
    }
    return [...new Set(found)];
  };

  const artificialSweeteners = findMatches(ARTIFICIAL_SWEETENERS);
  const artificialColorants = findMatches(ARTIFICIAL_COLORANTS);
  const preservatives = findMatches(PRESERVATIVES);
  const ultraProcessedMarkers = findMatches(ULTRA_PROCESSED_MARKERS);
  const flavorEnhancers = findMatches(FLAVOR_ENHANCERS);

  const sugarWords = ["azucar", "azúcar", "sugar", "sacarosa", "fructosa", "jarabe", "syrup", "miel", "honey"];
  const hasAddedSugar = sugarWords.some((w) => combined.includes(w));

  const waterWords = ["agua", "water"];
  const hasAddedWater = ingredients.length > 0 &&
    waterWords.some((w) => ingredients[0].toLowerCase().includes(w));

  const firstIngredient = ingredients[0] || "No disponible";

  // Classification based on NOVA system
  const badCount = artificialSweeteners.length + artificialColorants.length +
    preservatives.length + ultraProcessedMarkers.length + flavorEnhancers.length;

  let classification: IngredientAnalysis["classification"];
  let verdict: string;

  if (ingredients.length === 0) {
    classification = "processed";
    verdict = "Sin informacion de ingredientes disponible.";
  } else if (badCount === 0 && !hasAddedSugar && !hasAddedWater && ingredients.length <= 3) {
    classification = "natural";
    verdict = `100% natural. Solo contiene: ${ingredients.slice(0, 3).join(", ")}. Sin aditivos, sin azucar añadida.`;
  } else if (badCount === 0 && ingredients.length <= 6) {
    classification = "minimal";
    const issues: string[] = [];
    if (hasAddedSugar) issues.push("azucar añadida");
    if (hasAddedWater) issues.push("agua añadida");
    verdict = issues.length > 0
      ? `Minimamente procesado, pero contiene ${issues.join(" y ")}.`
      : `Minimamente procesado .`;
  } else if (badCount <= 2 && ingredients.length <= 10) {
    classification = "processed";
    const issues: string[] = [];
    if (artificialColorants.length > 0) issues.push("colorantes");
    if (preservatives.length > 0) issues.push("conservantes");
    if (hasAddedSugar) issues.push("azucar añadida");
    verdict = `Procesado. Contiene ${issues.join(", ")}. `;
  } else {
    classification = "ultra_processed";
    const issues: string[] = [];
    if (artificialSweeteners.length > 0) issues.push("edulcorantes artificiales");
    if (artificialColorants.length > 0) issues.push("colorantes");
    if (preservatives.length > 0) issues.push("conservantes");
    if (ultraProcessedMarkers.length > 0) issues.push("quimicos ultra-procesados");
    if (flavorEnhancers.length > 0) issues.push("saborizantes artificiales");
    if (hasAddedSugar && hasAddedWater) {
      verdict = `Ultra-procesado. Basicamente es agua con azucar y quimicos. Contiene: ${issues.join(", ")}.`;
    } else {
      verdict = `Ultra-procesado. Mezcla de quimicos: ${issues.join(", ")}.`;
    }
  }

  return {
    totalCount: ingredients.length,
    artificialSweeteners,
    artificialColorants,
    preservatives,
    ultraProcessedMarkers,
    flavorEnhancers,
    hasAddedSugar,
    hasAddedWater,
    firstIngredient,
    classification,
    verdict,
  };
}

// === HEALTH SCORING (ingredient-first approach) ===

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

  // Start score based on classification (this is the PRIMARY factor)
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

  // === INGREDIENT PENALTIES ===

  if (ia.artificialSweeteners.length > 0) {
    score -= 15;
    warnings.push(`Edulcorantes artificiales: ${ia.artificialSweeteners.join(", ")}`);
  }

  if (ia.artificialColorants.length > 0) {
    score -= 10;
    warnings.push(`Colorantes artificiales: ${ia.artificialColorants.join(", ")}`);
  }

  if (ia.preservatives.length > 0) {
    score -= 8;
    cons.push(`Conservantes: ${ia.preservatives.join(", ")}`);
  }

  if (ia.ultraProcessedMarkers.length > 0) {
    score -= 12;
    warnings.push(`Ingredientes ultra-procesados: ${ia.ultraProcessedMarkers.join(", ")}`);
  }

  if (ia.flavorEnhancers.length > 0) {
    score -= 8;
    cons.push(`Saborizantes/potenciadores: ${ia.flavorEnhancers.join(", ")}`);
  }

  if (ia.hasAddedSugar) {
    score -= 10;
    cons.push("Contiene azucar añadida");
  }

  if (ia.hasAddedWater && ia.hasAddedSugar) {
    score -= 5;
    cons.push("Primer ingrediente es agua — producto diluido");
  }

  // === NUTRITIONAL BONUSES/PENALTIES (secondary) ===

  if (info.sugars > 15) {
    score -= 5;
  } else if (info.sugars <= 2 && info.calories > 0) {
    score += 3;
  }

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
    warnings.push(`Contiene grasas trans: ${info.transFat}g`);
  }

  // === POSITIVE INGREDIENT SIGNALS ===

  if (ia.totalCount > 0 && ia.totalCount <= 3 && ia.classification === "natural") {
    score += 5;
    pros.push("Ingredientes simples y reconocibles");
  }

  if (info.additives.length === 0 && ia.totalCount > 0) {
    pros.push("Sin aditivos artificiales");
  }

  score = Math.max(0, Math.min(100, score));
  return { score, pros, cons, warnings, ingredientAnalysis: ia };
}

// === MAIN ANALYSIS ===

export function analyzeProducts(products: ScannedProduct[]): AnalysisResult {
  const analyses: ProductAnalysis[] = products.map((product) => {
    const { score, pros, cons, warnings, ingredientAnalysis } =
      calculateHealthScore(product.nutritionalInfo);
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
