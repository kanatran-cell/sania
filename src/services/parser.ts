import type { NutritionalInfo } from "../types/product";

/**
 * Parses raw OCR text from a nutritional label.
 * Handles Chilean/Latin American tabular labels where:
 * - Labels are listed in a column
 * - Values are in separate columns (100g and per-serving)
 * - OCR reads labels first, then numbers
 */
export function parseNutritionalLabel(rawText: string): NutritionalInfo {
  const text = rawText.toLowerCase().replace(/\r\n/g, "\n").replace(/\t/g, " ").replace(/ {2,}/g, " ").replace(/\|/g, "l");
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  console.log("[SanIA Parser] Lines:", JSON.stringify(lines));

  // Strategy: find nutrient labels and their order, then find the number blocks
  const nutrientOrder = findNutrientLabels(lines);
  const numberBlocks = findNumberBlocks(lines);

  console.log("[SanIA Parser] Nutrient order:", JSON.stringify(nutrientOrder));
  console.log("[SanIA Parser] Number blocks:", JSON.stringify(numberBlocks));

  // Map nutrients to values using the best number block
  const nutrientValues = mapNutrientsToValues(nutrientOrder, numberBlocks);
  console.log("[SanIA Parser] Mapped values:", JSON.stringify(nutrientValues));

  // Also try inline parsing as fallback
  const inlineValues = parseInline(text);

  // Merge: prefer mapped values, fallback to inline
  const get = (keys: string[]): number => {
    for (const k of keys) {
      if (nutrientValues[k] !== undefined && nutrientValues[k] > 0) return nutrientValues[k];
    }
    for (const k of keys) {
      if (inlineValues[k] !== undefined && inlineValues[k] > 0) return inlineValues[k];
    }
    return 0;
  };

  const calories = get(["energia", "kcal", "caloria", "cal"]);
  const sodium = get(["sodio", "sodium"]);

  return {
    productName: extractProductName(lines),
    brand: extractBrand(lines),
    servingSize: extractServingSize(text),
    calories,
    totalFat: get(["grasa total", "grasas totales", "grasa tot"]),
    saturatedFat: get(["grasa saturada", "grasas saturadas", "gracae saturadas", "saturada"]),
    transFat: get(["grasa trans", "trans"]),
    sodium: sodium < 10 && sodium > 0 ? Math.round(sodium * 1000) : sodium,
    totalCarbs: get(["h. de c", "hidratos", "carbohidrato", "carbohidratos"]),
    sugars: get(["azucares totales", "azucar", "azucares"]),
    addedSugars: get(["azucares anadid", "azucar anadid"]),
    fiber: get(["fibra dietaria", "fibra dietetica", "fibra alimentaria", "fibra"]),
    protein: get(["proteina", "proieinas", "protein", "prot"]),
    ingredients: extractIngredients(text),
    additives: extractAdditives(text),
  };
}

interface NutrientLabel {
  name: string;
  lineIndex: number;
}

/**
 * Find lines that contain nutrient label names and their order
 */
function findNutrientLabels(lines: string[]): NutrientLabel[] {
  const labels: NutrientLabel[] = [];
  const nutrientPatterns: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /energ[ií]a|kcal|calor/i, name: "energia" },
    { pattern: /prote[ií]na|proieina/i, name: "proteina" },
    { pattern: /grasa.?total|grasas?\s*tot|crsese\s*tot/i, name: "grasa total" },
    { pattern: /grasa.?saturad|gracae\s*saturad|saturadas/i, name: "grasa saturada" },
    { pattern: /grasa.?monoinsat/i, name: "grasa monoinsat" },
    { pattern: /grasa.?poliinsat|pollinsat/i, name: "grasa poliinsat" },
    { pattern: /grasa.?trans/i, name: "grasa trans" },
    { pattern: /colesterol/i, name: "colesterol" },
    { pattern: /h\.?\s*de?\s*c|hidratos|carbohidrato/i, name: "h. de c" },
    { pattern: /az[uú]cares?\s*total/i, name: "azucares totales" },
    { pattern: /fibra/i, name: "fibra dietaria" },
    { pattern: /sodio|sodium/i, name: "sodio" },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const np of nutrientPatterns) {
      if (np.pattern.test(line)) {
        // Check if this line also has a number (inline format)
        labels.push({ name: np.name, lineIndex: i });
        break;
      }
    }
  }

  return labels;
}

/**
 * Find consecutive blocks of numbers in the OCR output.
 * These are the value columns (100g and per-serving).
 */
function findNumberBlocks(lines: string[]): Array<{ startIndex: number; numbers: number[] }> {
  const blocks: Array<{ startIndex: number; numbers: number[] }> = [];
  let currentBlock: number[] = [];
  let blockStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // A line is "numeric" if it's mainly a number (possibly with units or dashes)
    const nums = line.match(/(\d+[.,]\d+|\d+)/g);
    const isNumeric = nums && nums.length > 0 && line.replace(/[\d.,\s\-%gm()/lx]/g, "").length < 3;

    if (isNumeric && nums) {
      if (blockStart === -1) blockStart = i;
      // Take the first number from the line
      currentBlock.push(parseFloat(nums[0].replace(",", ".")));
    } else {
      if (currentBlock.length >= 3) {
        blocks.push({ startIndex: blockStart, numbers: [...currentBlock] });
      }
      currentBlock = [];
      blockStart = -1;
    }
  }

  if (currentBlock.length >= 3) {
    blocks.push({ startIndex: blockStart, numbers: [...currentBlock] });
  }

  return blocks;
}

/**
 * Map nutrient labels to their values using the number blocks.
 * The key insight: the order of labels matches the order of numbers.
 */
function mapNutrientsToValues(
  labels: NutrientLabel[],
  numberBlocks: Array<{ startIndex: number; numbers: number[] }>
): Record<string, number> {
  const result: Record<string, number> = {};

  if (labels.length === 0 || numberBlocks.length === 0) return result;

  // Find the best number block: should come after the labels and have enough numbers
  // Try each block and see which one aligns best with the label count
  for (const block of numberBlocks) {
    if (block.numbers.length >= labels.length * 0.5) {
      // Map labels to numbers in order
      for (let i = 0; i < labels.length && i < block.numbers.length; i++) {
        result[labels[i].name] = block.numbers[i];
      }

      // If we mapped at least some values, use this block
      if (Object.keys(result).length >= 3) {
        return result;
      }
    }
  }

  // Fallback: try the largest block
  const largestBlock = numberBlocks.reduce((a, b) => a.numbers.length > b.numbers.length ? a : b, numberBlocks[0]);
  if (largestBlock) {
    for (let i = 0; i < labels.length && i < largestBlock.numbers.length; i++) {
      result[labels[i].name] = largestBlock.numbers[i];
    }
  }

  return result;
}

/**
 * Fallback: try inline parsing (value next to label on same line)
 */
function parseInline(text: string): Record<string, number> {
  const result: Record<string, number> = {};
  const patterns: Array<{ key: string; pattern: RegExp }> = [
    { key: "energia", pattern: /(?:energ[ií]a|calor[ií]as?|kcal)[:\s]*(\d+[.,]?\d*)/ },
    { key: "proteina", pattern: /prote[ií]nas?[:\s]*(\d+[.,]?\d*)/ },
    { key: "grasa total", pattern: /grasas?\s*totale?s?[:\s]*(\d+[.,]?\d*)/ },
    { key: "grasa saturada", pattern: /grasas?\s*saturadas?[:\s]*(\d+[.,]?\d*)/ },
    { key: "grasa trans", pattern: /grasas?\s*trans[:\s]*(\d+[.,]?\d*)/ },
    { key: "sodio", pattern: /sodio[:\s]*(\d+[.,]?\d*)/ },
    { key: "h. de c", pattern: /(?:carbohidratos?|h\.?\s*de?\s*c)[:\s]*(\d+[.,]?\d*)/ },
    { key: "azucares totales", pattern: /az[uú]cares?[:\s]*(\d+[.,]?\d*)/ },
    { key: "fibra dietaria", pattern: /fibra[:\s]*(\d+[.,]?\d*)/ },
  ];

  for (const p of patterns) {
    const m = text.match(p.pattern);
    if (m?.[1]) result[p.key] = parseFloat(m[1].replace(",", "."));
  }

  return result;
}

function extractServingSize(text: string): string {
  const m = text.match(/porci[oó]n[:\s]*([^\n]+)/i);
  return m?.[1]?.trim() || "No detectado";
}

function extractProductName(lines: string[]): string {
  const skip = /informaci|nutri|ingredi|tabla|hecho|fabricado|contenido|porci|serving|datos|daily|value|cantidad|lote|exp|caduc|conserv|energia|kcal|calori|grasa|proteina|carbohidrat|sodio|azucar|fibra|100\s*g|^\d|nvidia|geforce|gtx|porciones/i;
  for (const line of lines.slice(0, 8)) {
    if (line.length > 2 && line.length < 50 && !skip.test(line)) {
      return capitalizeWords(line);
    }
  }
  return "Producto";
}

function extractBrand(lines: string[]): string {
  for (const line of lines.slice(0, 10)) {
    const m = line.match(/^(?:marca|brand|hecho\s*por|elaborado\s*por|fabricado\s*por)[:\s]+(.+)/i);
    if (m?.[1]) return capitalizeWords(m[1].trim());
    if (/[®™©]/.test(line)) {
      const b = line.replace(/[®™©]/g, "").trim();
      if (b.length > 1 && b.length < 40) return capitalizeWords(b);
    }
  }
  return "Marca no detectada";
}

function extractIngredients(text: string): string[] {
  const m = text.match(/ingredientes?[:\s]*([^.]*?)(?:\.\s*(?:contiene|informaci|tabla|valor|hecho)|$)/is);
  if (m?.[1] && m[1].length > 5) {
    return m[1].split(/[,;]/).map((i) => i.trim()).filter((i) => i.length > 1 && i.length < 80);
  }
  return [];
}

const KNOWN_ADDITIVES = [
  "e102", "e110", "e120", "e122", "e124", "e129", "e133", "e150", "e171",
  "e211", "e220", "e250", "e330", "e621", "e951", "e950", "e955",
  "aspartamo", "sucralosa", "sacarina", "glutamato", "msg", "benzoato",
  "sorbato", "nitrito", "nitrato", "tartrazina", "rojo 40", "amarillo 5",
  "bht", "bha", "tbhq", "carragenina", "jarabe de maiz", "maltodextrina",
  "aceite vegetal hidrogenado", "parcialmente hidrogenado",
];

function extractAdditives(text: string): string[] {
  const found: string[] = [];
  for (const a of KNOWN_ADDITIVES) {
    if (text.includes(a)) found.push(capitalizeWords(a));
  }
  return [...new Set(found)];
}

function capitalizeWords(str: string): string {
  return str.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
