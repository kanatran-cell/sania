import type { NutritionalInfo } from "../types/product";

/**
 * Parses raw OCR text from a nutritional label into structured data.
 * Handles common Spanish and English label formats.
 */
export function parseNutritionalLabel(rawText: string): NutritionalInfo {
  const text = rawText.toLowerCase();
  const lines = text.split("\n").map((l) => l.trim());

  return {
    productName: extractProductName(lines),
    brand: extractBrand(lines),
    servingSize: extractValue(text, [
      /porci[oó]n[:\s]+([^\n,]+)/i,
      /serving size[:\s]+([^\n,]+)/i,
      /tama[ñn]o de porci[oó]n[:\s]+([^\n,]+)/i,
    ]) || "No detectado",
    calories: extractNumber(text, [
      /calor[ií]as[:\s]*(\d+)/,
      /energ[ií]a[:\s]*(\d+)/,
      /calories[:\s]*(\d+)/,
      /valor energ[eé]tico[:\s]*(\d+)/,
      /kcal[:\s]*(\d+)/,
      /(\d+)\s*kcal/,
    ]),
    totalFat: extractNumber(text, [
      /grasas?\s*totale?s?[:\s]*(\d+[.,]?\d*)/,
      /total\s*fat[:\s]*(\d+[.,]?\d*)/,
      /l[ií]pidos[:\s]*(\d+[.,]?\d*)/,
    ]),
    saturatedFat: extractNumber(text, [
      /grasas?\s*saturadas?[:\s]*(\d+[.,]?\d*)/,
      /saturated\s*fat[:\s]*(\d+[.,]?\d*)/,
    ]),
    transFat: extractNumber(text, [
      /grasas?\s*trans[:\s]*(\d+[.,]?\d*)/,
      /trans\s*fat[:\s]*(\d+[.,]?\d*)/,
    ]),
    sodium: extractNumber(text, [
      /sodio[:\s]*(\d+[.,]?\d*)/,
      /sodium[:\s]*(\d+[.,]?\d*)/,
      /sal[:\s]*(\d+[.,]?\d*)/,
    ]),
    totalCarbs: extractNumber(text, [
      /carbohidratos?\s*totale?s?[:\s]*(\d+[.,]?\d*)/,
      /hidratos\s*de\s*carbono[:\s]*(\d+[.,]?\d*)/,
      /total\s*carb[:\s]*(\d+[.,]?\d*)/,
    ]),
    sugars: extractNumber(text, [
      /az[uú]cares?\s*totale?s?[:\s]*(\d+[.,]?\d*)/,
      /az[uú]cares?[:\s]*(\d+[.,]?\d*)/,
      /sugars?[:\s]*(\d+[.,]?\d*)/,
    ]),
    addedSugars: extractNumber(text, [
      /az[uú]cares?\s*a[ñn]adid[oa]s?[:\s]*(\d+[.,]?\d*)/,
      /added\s*sugars?[:\s]*(\d+[.,]?\d*)/,
    ]),
    fiber: extractNumber(text, [
      /fibra[:\s]*(\d+[.,]?\d*)/,
      /fiber[:\s]*(\d+[.,]?\d*)/,
      /fibra\s*diet[eé]tica[:\s]*(\d+[.,]?\d*)/,
    ]),
    protein: extractNumber(text, [
      /prote[ií]nas?[:\s]*(\d+[.,]?\d*)/,
      /protein[:\s]*(\d+[.,]?\d*)/,
    ]),
    ingredients: extractIngredients(text),
    additives: extractAdditives(text),
  };
}

function extractNumber(text: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return parseFloat(match[1].replace(",", "."));
    }
  }
  return 0;
}

function extractValue(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractProductName(lines: string[]): string {
  // Usually the first non-empty line with substantial text is the product name
  for (const line of lines.slice(0, 5)) {
    const cleaned = line.trim();
    if (cleaned.length > 2 && !/informaci[oó]n|nutri|ingredi|tabla/i.test(cleaned)) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
  return "Producto";
}

function extractBrand(lines: string[]): string {
  // Brand is often in the first few lines, sometimes after the product name
  for (const line of lines.slice(0, 8)) {
    if (/^(marca|brand|by|de|por)[:\s]/i.test(line)) {
      return line.replace(/^(marca|brand|by|de|por)[:\s]*/i, "").trim();
    }
  }
  return "Marca no detectada";
}

function extractIngredients(text: string): string[] {
  const match = text.match(
    /ingredientes?[:\s]*([^.]*?)(?:\.|informaci[oó]n|tabla|contiene|$)/i
  );
  if (!match?.[1]) return [];

  return match[1]
    .split(/[,;]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 1);
}

const KNOWN_ADDITIVES = [
  "e100", "e101", "e102", "e104", "e110", "e120", "e122", "e124", "e127",
  "e129", "e131", "e132", "e133", "e142", "e150", "e151", "e155", "e160",
  "e171", "e200", "e202", "e210", "e211", "e212", "e213", "e220", "e221",
  "e222", "e223", "e224", "e226", "e228", "e249", "e250", "e251", "e252",
  "e270", "e280", "e281", "e282", "e283", "e290", "e300", "e301", "e306",
  "e307", "e310", "e320", "e321", "e322", "e330", "e331", "e332", "e333",
  "e334", "e335", "e336", "e338", "e339", "e340", "e341", "e400", "e401",
  "e406", "e407", "e410", "e412", "e414", "e415", "e420", "e421", "e422",
  "e440", "e450", "e451", "e452", "e460", "e461", "e463", "e464", "e466",
  "e470", "e471", "e472", "e473", "e475", "e476", "e481", "e491", "e492",
  "e500", "e501", "e503", "e507", "e508", "e509", "e511", "e516", "e524",
  "e551", "e552", "e553", "e570", "e575", "e621", "e627", "e631", "e635",
  "e900", "e901", "e903", "e950", "e951", "e952", "e953", "e954", "e955",
  "e960", "e961", "e962", "e965", "e966", "e967",
  // Common names
  "aspartame", "aspartamo",
  "glutamato", "glutamate", "msg",
  "benzoato", "benzoate",
  "nitrito", "nitrite", "nitrato", "nitrate",
  "tartrazina", "tartrazine",
  "rojo 40", "red 40", "amarillo 5", "yellow 5", "yellow 6", "amarillo 6",
  "carragenina", "carrageenan",
  "bht", "bha", "tbhq",
];

function extractAdditives(text: string): string[] {
  const found: string[] = [];
  for (const additive of KNOWN_ADDITIVES) {
    if (text.includes(additive)) {
      found.push(additive.toUpperCase());
    }
  }
  return [...new Set(found)];
}
