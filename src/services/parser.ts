import type { NutritionalInfo } from "../types/product";

/**
 * Parses raw OCR text from a nutritional label into structured data.
 * Supports: Spanish, English, Mexican NOM labels, Chilean warning labels,
 * European format, and common OCR errors.
 */
export function parseNutritionalLabel(rawText: string): NutritionalInfo {
  // Normalize OCR artifacts: fix common misreads
  const text = normalizeOcrText(rawText);
  const lines = text.split("\n").map((l) => l.trim());

  return {
    productName: extractProductName(lines),
    brand: extractBrand(lines),
    servingSize:
      extractValue(text, [
        /porci[oó]n[:\s]+([^\n,]+)/i,
        /serving\s*size[:\s]+([^\n,]+)/i,
        /tama[ñn]o\s*de\s*porci[oó]n[:\s]+([^\n,]+)/i,
        /por\s*porci[oó]n\s*de\s+([^\n,]+)/i,
        /per\s*serving[:\s]+([^\n,]+)/i,
        /porci[oó]n\s*\/\s*portion[:\s]+([^\n,]+)/i,
        /contenido\s*por\s*envase[:\s]+([^\n,]+)/i,
      ]) || "No detectado",
    calories: extractNumber(text, [
      /calor[ií]as[:\s]*(\d+)/,
      /energ[ií]a[:\s]*(\d+)/,
      /calories[:\s]*(\d+)/,
      /valor\s*energ[eé]tico[:\s]*(\d+)/,
      /kcal[:\s]*(\d+)/,
      /(\d+)\s*kcal/,
      /cal[:\s]*(\d+)/,
      /energy[:\s]*(\d+)/,
      /contenido\s*energ[eé]tico[:\s]*(\d+)/,
      /(\d+)\s*calor[ií]as/,
    ]),
    totalFat: extractNumber(text, [
      /grasas?\s*totale?s?[:\s]*(\d+[.,]?\d*)/,
      /total\s*fat[:\s]*(\d+[.,]?\d*)/,
      /l[ií]pidos[:\s]*(\d+[.,]?\d*)/,
      /fat[:\s]*(\d+[.,]?\d*)\s*g/,
      /grasa[:\s]*(\d+[.,]?\d*)/,
      /materia\s*grasa[:\s]*(\d+[.,]?\d*)/,
    ]),
    saturatedFat: extractNumber(text, [
      /grasas?\s*saturadas?[:\s]*(\d+[.,]?\d*)/,
      /saturated\s*fat[:\s]*(\d+[.,]?\d*)/,
      /saturadas?[:\s]*(\d+[.,]?\d*)/,
      /de\s*las\s*cuales\s*saturadas[:\s]*(\d+[.,]?\d*)/,
      /sat\.\s*fat[:\s]*(\d+[.,]?\d*)/,
    ]),
    transFat: extractNumber(text, [
      /grasas?\s*trans[:\s]*(\d+[.,]?\d*)/,
      /trans\s*fat[:\s]*(\d+[.,]?\d*)/,
      /[aá]cidos\s*grasos\s*trans[:\s]*(\d+[.,]?\d*)/,
    ]),
    sodium: extractSodium(text),
    totalCarbs: extractNumber(text, [
      /carbohidratos?\s*totale?s?[:\s]*(\d+[.,]?\d*)/,
      /hidratos\s*de\s*carbono[:\s]*(\d+[.,]?\d*)/,
      /total\s*carb[ohydrates]*[:\s]*(\d+[.,]?\d*)/,
      /carbohidratos?[:\s]*(\d+[.,]?\d*)/,
      /carbs?[:\s]*(\d+[.,]?\d*)/,
      /gl[uú]cidos[:\s]*(\d+[.,]?\d*)/,
      /h\.\s*de\s*c\.[:\s]*(\d+[.,]?\d*)/,
    ]),
    sugars: extractNumber(text, [
      /az[uú]cares?\s*totale?s?[:\s]*(\d+[.,]?\d*)/,
      /az[uú]cares?[:\s]*(\d+[.,]?\d*)/,
      /sugars?[:\s]*(\d+[.,]?\d*)/,
      /de\s*los?\s*cuales\s*az[uú]cares?[:\s]*(\d+[.,]?\d*)/,
      /total\s*sugars?[:\s]*(\d+[.,]?\d*)/,
      /sacarosa[:\s]*(\d+[.,]?\d*)/,
    ]),
    addedSugars: extractNumber(text, [
      /az[uú]cares?\s*a[ñn]adid[oa]s?[:\s]*(\d+[.,]?\d*)/,
      /added\s*sugars?[:\s]*(\d+[.,]?\d*)/,
      /az[uú]cares?\s*agregad[oa]s?[:\s]*(\d+[.,]?\d*)/,
      /incl.*?(\d+[.,]?\d*)\s*g?\s*az[uú]cares?\s*a[ñn]adid/,
    ]),
    fiber: extractNumber(text, [
      /fibra\s*diet[eé]tica[:\s]*(\d+[.,]?\d*)/,
      /fibra\s*alimentaria[:\s]*(\d+[.,]?\d*)/,
      /fibra[:\s]*(\d+[.,]?\d*)/,
      /dietary\s*fiber[:\s]*(\d+[.,]?\d*)/,
      /fiber[:\s]*(\d+[.,]?\d*)/,
      /fibre[:\s]*(\d+[.,]?\d*)/,
    ]),
    protein: extractNumber(text, [
      /prote[ií]nas?[:\s]*(\d+[.,]?\d*)/,
      /protein[ae]?s?[:\s]*(\d+[.,]?\d*)/,
      /prot\.[:\s]*(\d+[.,]?\d*)/,
    ]),
    ingredients: extractIngredients(text),
    additives: extractAdditives(text),
  };
}

/**
 * Normalize common OCR misreads
 */
function normalizeOcrText(raw: string): string {
  return raw
    .toLowerCase()
    // Fix common OCR letter/number confusions
    .replace(/[oO](?=\d)/g, "0") // O before digit → 0
    .replace(/(?<=\d)[oO]/g, "0") // O after digit → 0
    .replace(/[lI](?=\d)/g, "1") // l/I before digit → 1
    .replace(/(?<=\d)[lI]/g, "1") // l/I after digit → 1
    // Normalize whitespace
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/ {2,}/g, " ")
    // Fix common label OCR artifacts
    .replace(/mg\/g/g, "mg") // units cleanup
    .replace(/\|/g, "l") // pipe → l
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'");
}

function extractNumber(text: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const val = parseFloat(match[1].replace(",", "."));
      if (!isNaN(val)) return val;
    }
  }
  return 0;
}

/**
 * Sodium needs special handling because labels may show it in mg or g,
 * and some labels show "sal" (salt) instead of sodium.
 * Salt = sodium * 2.5
 */
function extractSodium(text: string): number {
  // Try direct sodium in mg
  const sodiumMg = extractNumber(text, [
    /sodio[:\s]*(\d+[.,]?\d*)\s*mg/,
    /sodium[:\s]*(\d+[.,]?\d*)\s*mg/,
    /sodio[:\s]*(\d+[.,]?\d*)/,
    /sodium[:\s]*(\d+[.,]?\d*)/,
    /na[:\s]*(\d+[.,]?\d*)\s*mg/,
  ]);
  if (sodiumMg > 0) return sodiumMg;

  // Try sodium in g (convert to mg)
  const sodiumG = extractNumber(text, [
    /sodio[:\s]*(\d+[.,]?\d*)\s*g(?!r)/,
    /sodium[:\s]*(\d+[.,]?\d*)\s*g(?!r)/,
  ]);
  if (sodiumG > 0 && sodiumG < 10) return sodiumG * 1000;

  // Try salt (sal) and convert to sodium (divide by 2.5)
  const saltG = extractNumber(text, [
    /sal[:\s]*(\d+[.,]?\d*)\s*g/,
    /salt[:\s]*(\d+[.,]?\d*)\s*g/,
  ]);
  if (saltG > 0) return Math.round((saltG / 2.5) * 1000);

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
  const skipPatterns =
    /informaci[oó]n|nutri|ingredi|tabla|hecho\s*en|fabricado|contenido|porci[oó]n|serving|datos|daily|value|amount|cantidad|lote|exp|caduc|conserv|manteng|almacen|^[0-9.,\s%]+$/i;

  // First pass: look for prominent text (likely product name)
  for (const line of lines.slice(0, 8)) {
    const cleaned = line.trim();
    if (cleaned.length > 2 && cleaned.length < 60 && !skipPatterns.test(cleaned)) {
      return capitalizeWords(cleaned);
    }
  }
  return "Producto";
}

function extractBrand(lines: string[]): string {
  // Look for explicit brand markers
  for (const line of lines.slice(0, 10)) {
    const brandMatch = line.match(
      /^(?:marca|brand|by|de|por|hecho\s*por|elaborado\s*por|fabricado\s*por|manufactured\s*by)[:\s]+(.+)/i
    );
    if (brandMatch?.[1]) {
      return capitalizeWords(brandMatch[1].trim());
    }
  }

  // Look for registered trademark symbols
  for (const line of lines.slice(0, 10)) {
    if (/[®™©]/.test(line)) {
      const brand = line.replace(/[®™©]/g, "").trim();
      if (brand.length > 1 && brand.length < 40) {
        return capitalizeWords(brand);
      }
    }
  }

  return "Marca no detectada";
}

function extractIngredients(text: string): string[] {
  // Try multiple ingredient section patterns
  const patterns = [
    /ingredientes?[:\s]*([^.]*?)(?:\.\s*(?:contiene|informaci|tabla|valor|aporte|hecho|elabor|conserv|manteng)|$)/is,
    /ingredients?[:\s]*([^.]*?)(?:\.\s*(?:contains|nutrition|facts|made|manufactured)|$)/is,
    /lista\s*de\s*ingredientes?[:\s]*([^.]*?)(?:\.|$)/is,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1] && match[1].length > 5) {
      return match[1]
        .split(/[,;]/)
        .map((i) => i.trim())
        .filter((i) => i.length > 1 && i.length < 80)
        .map((i) => i.replace(/^\d+[.)\s]+/, "")); // Remove numbered lists
    }
  }
  return [];
}

const KNOWN_ADDITIVES = [
  // E-numbers (European codes)
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
  // Artificial sweeteners (Spanish & English)
  "aspartame", "aspartamo", "acesulfame", "acesulfamo",
  "sucralosa", "sucralose", "sacarina", "saccharin",
  "ciclamato", "cyclamate", "neotame", "neotamo",
  "advantame", "stevia", "estevia",
  // Preservatives
  "glutamato", "glutamate", "msg", "glutamato monosodico",
  "benzoato", "benzoate", "sorbato", "sorbate",
  "nitrito", "nitrite", "nitrato", "nitrate",
  "sulfito", "sulfite", "bisulfito",
  "propionato", "propionate",
  // Colorants
  "tartrazina", "tartrazine",
  "rojo 40", "red 40", "rojo allura", "allura red",
  "amarillo 5", "yellow 5", "amarillo 6", "yellow 6",
  "amarillo ocaso", "sunset yellow",
  "azul 1", "blue 1", "azul 2", "blue 2",
  "azul brillante", "brilliant blue",
  "caramelo", "caramel color",
  "dioxido de titanio", "titanium dioxide",
  // Antioxidants
  "bht", "bha", "tbhq",
  "eritorbato", "erythorbate",
  // Emulsifiers & thickeners
  "carragenina", "carrageenan", "carragenano",
  "goma xantana", "xanthan gum", "goma guar", "guar gum",
  "lecitina", "lecithin",
  "polisorbato", "polysorbate",
  "monoestearato", "monostearate",
  "diglicerido", "diglyceride", "monoglicerido", "monoglyceride",
  // Flavor enhancers
  "inosinato", "inosinate", "guanilato", "guanylate",
  "maltodextrina", "maltodextrin",
  "proteina hidrolizada", "hydrolyzed protein",
  "extracto de levadura", "yeast extract",
  // Mexican NOM specific
  "jarabe de maiz", "jarabe de maiz de alta fructosa",
  "high fructose corn syrup", "hfcs",
  "aceite vegetal hidrogenado", "hydrogenated",
  "parcialmente hidrogenado", "partially hydrogenated",
];

function extractAdditives(text: string): string[] {
  const found: string[] = [];
  for (const additive of KNOWN_ADDITIVES) {
    // Use word boundary-like matching to avoid false positives
    const escaped = additive.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,;:(])${escaped}(?:[\\s,;:).]|$)`, "i");
    if (regex.test(text)) {
      found.push(capitalizeWords(additive));
    }
  }
  return [...new Set(found)];
}

function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
