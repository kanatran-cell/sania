/**
 * Database of harmful ingredients classified by severity level.
 *
 * Sources:
 * - IARC (WHO) - Carcinogen classification
 * - EFSA (European Food Safety Authority) - Restricted/banned additives in EU
 * - CSPI (Center for Science in the Public Interest) - Additive safety ratings
 * - Chilean Food Labeling Law (Ley 20.606)
 * - FDA GRAS (Generally Recognized as Safe) review
 *
 * Levels:
 * 1 = DANGEROUS - Strong scientific evidence of harm. Banned or restricted in some countries.
 * 2 = CONCERNING - Moderate evidence. Better to avoid, especially for children.
 * 3 = MILD - Processed but generally safe in normal quantities.
 */

export interface HarmfulIngredient {
  names: string[];
  level: 1 | 2 | 3;
  category: string;
  reason: string;
}

export const HARMFUL_INGREDIENTS: HarmfulIngredient[] = [
  // ============================================================
  // LEVEL 1 - DANGEROUS
  // ============================================================

  // --- Trans fats ---
  {
    names: ["aceite parcialmente hidrogenado", "partially hydrogenated", "aceite vegetal hidrogenado", "grasa hidrogenada", "hydrogenated vegetable oil", "shortening hidrogenado"],
    level: 1,
    category: "Grasas trans",
    reason: "Aumenta colesterol malo (LDL), reduce el bueno (HDL). Vinculado a enfermedades cardiovasculares. Prohibido en varios paises.",
  },
  {
    names: ["grasa trans", "trans fat"],
    level: 1,
    category: "Grasas trans",
    reason: "La OMS recomienda eliminar completamente las grasas trans de los alimentos.",
  },

  // --- Synthetic antioxidants ---
  {
    names: ["bha", "butilhidroxianisol", "e320"],
    level: 1,
    category: "Antioxidante sintetico",
    reason: "Posible carcinogeno segun IARC (Grupo 2B). Prohibido en alimentos infantiles en la UE.",
  },
  {
    names: ["bht", "butilhidroxitolueno", "e321"],
    level: 1,
    category: "Antioxidante sintetico",
    reason: "Posible disruptor endocrino. Vinculado a problemas hepaticos en estudios animales.",
  },
  {
    names: ["tbhq", "terbutilhidroquinona", "e319"],
    level: 1,
    category: "Antioxidante sintetico",
    reason: "En dosis altas causa nauseas y dano hepatico. Prohibido en Japon.",
  },

  // --- Nitrites/Nitrates ---
  {
    names: ["nitrito de sodio", "sodium nitrite", "nitrito", "e250"],
    level: 1,
    category: "Conservante",
    reason: "Forma nitrosaminas cancerigenas al cocinar o en el estomago. IARC clasifica carnes procesadas con nitritos como carcinogeno Grupo 1.",
  },
  {
    names: ["nitrato de sodio", "sodium nitrate", "nitrato", "e251"],
    level: 1,
    category: "Conservante",
    reason: "Se convierte en nitrito en el cuerpo. Asociado a cancer colorrectal.",
  },

  // --- Dangerous colorants ---
  {
    names: ["rojo 40", "red 40", "rojo allura", "allura red", "e129"],
    level: 1,
    category: "Colorante artificial",
    reason: "Vinculado a hiperactividad en ninos (estudio Southampton). Requiere advertencia en la UE. Derivado del petroleo.",
  },
  {
    names: ["amarillo 5", "yellow 5", "tartrazina", "tartrazine", "e102"],
    level: 1,
    category: "Colorante artificial",
    reason: "Asociado a hiperactividad, alergias y asma. Requiere advertencia en la UE. Prohibido en Noruega.",
  },
  {
    names: ["amarillo 6", "yellow 6", "amarillo ocaso", "sunset yellow", "e110"],
    level: 1,
    category: "Colorante artificial",
    reason: "Vinculado a hiperactividad y reacciones alergicas. Contaminado con bencidina (carcinogeno).",
  },
  {
    names: ["rojo 3", "red 3", "eritrosina", "erythrosine", "e127"],
    level: 1,
    category: "Colorante artificial",
    reason: "Carcinogeno tiroideo en animales. Prohibido en cosmeticos en EE.UU. desde 1990.",
  },
  {
    names: ["azul 1", "blue 1", "azul brillante", "brilliant blue", "e133"],
    level: 1,
    category: "Colorante artificial",
    reason: "Derivado del petroleo. Puede cruzar la barrera hematoencefalica. Vinculado a reacciones alergicas.",
  },
  {
    names: ["azul 2", "blue 2", "indigotina", "indigo carmine", "e132"],
    level: 1,
    category: "Colorante artificial",
    reason: "Derivado del petroleo. Asociado a tumores cerebrales en estudios animales.",
  },
  {
    names: ["dioxido de titanio", "titanium dioxide", "e171"],
    level: 1,
    category: "Colorante",
    reason: "Prohibido como aditivo alimentario en la UE desde 2022. Posible genotoxicidad segun EFSA.",
  },

  // --- Brominated vegetable oil ---
  {
    names: ["aceite vegetal bromado", "brominated vegetable oil", "bvo"],
    level: 1,
    category: "Estabilizante",
    reason: "Prohibido en la UE e India. Acumula bromo en el cuerpo. Dano neurologico en estudios.",
  },

  // ============================================================
  // LEVEL 2 - CONCERNING
  // ============================================================

  // --- Artificial sweeteners ---
  {
    names: ["aspartame", "aspartamo", "e951"],
    level: 2,
    category: "Edulcorante artificial",
    reason: "IARC lo clasifico como posible carcinogeno (Grupo 2B) en 2023. Puede alterar microbioma intestinal.",
  },
  {
    names: ["acesulfame k", "acesulfame", "acesulfamo", "acesulfamo k", "e950"],
    level: 2,
    category: "Edulcorante artificial",
    reason: "Estudios sugieren que puede alterar el microbioma intestinal y la respuesta a la insulina.",
  },
  {
    names: ["sucralosa", "sucralose", "e955"],
    level: 2,
    category: "Edulcorante artificial",
    reason: "A altas temperaturas genera compuestos clorados toxicos. Puede alterar la flora intestinal.",
  },
  {
    names: ["sacarina", "saccharin", "e954"],
    level: 2,
    category: "Edulcorante artificial",
    reason: "Fue clasificada como posible carcinogeno (retirado en 2000, pero evidencia mixta). Sabor metalico.",
  },
  {
    names: ["ciclamato", "cyclamate", "e952"],
    level: 2,
    category: "Edulcorante artificial",
    reason: "Prohibido en EE.UU. desde 1969. Posible carcinogeno de vejiga.",
  },
  {
    names: ["neotame", "neotamo", "e961"],
    level: 2,
    category: "Edulcorante artificial",
    reason: "Derivado del aspartamo. Pocos estudios independientes sobre seguridad a largo plazo.",
  },

  // --- Preservatives ---
  {
    names: ["benzoato de sodio", "sodium benzoate", "benzoato", "e211"],
    level: 2,
    category: "Conservante",
    reason: "Con vitamina C forma benceno (carcinogeno). Vinculado a hiperactividad en ninos.",
  },
  {
    names: ["sorbato de potasio", "potassium sorbate", "sorbato", "e202"],
    level: 2,
    category: "Conservante",
    reason: "Puede causar reacciones alergicas. Genotoxicidad in vitro reportada.",
  },
  {
    names: ["sulfito", "sulfite", "bisulfito", "metabisulfito", "e220", "e221", "e222", "e223", "e224", "e226", "e228"],
    level: 2,
    category: "Conservante",
    reason: "Causa reacciones severas en asmaticos. Destruye vitamina B1.",
  },
  {
    names: ["propionato de calcio", "calcium propionate", "propionato", "e282"],
    level: 2,
    category: "Conservante",
    reason: "Asociado a irritabilidad y problemas de atencion en ninos en algunos estudios.",
  },

  // --- Flavor enhancers ---
  {
    names: ["glutamato monosodico", "monosodium glutamate", "glutamato", "msg", "e621"],
    level: 2,
    category: "Potenciador de sabor",
    reason: "Puede causar dolor de cabeza, nauseas en personas sensibles. Enmascara sabor de ingredientes de baja calidad.",
  },
  {
    names: ["inosinato", "disodium inosinate", "e631"],
    level: 2,
    category: "Potenciador de sabor",
    reason: "Generalmente usado junto con MSG. Puede causar reacciones en personas sensibles al glutamato.",
  },
  {
    names: ["guanilato", "disodium guanylate", "e627"],
    level: 2,
    category: "Potenciador de sabor",
    reason: "Potenciador de MSG. Contraindicado para personas con gota o acido urico alto.",
  },

  // --- Ultra-processed markers ---
  {
    names: ["jarabe de maiz de alta fructosa", "high fructose corn syrup", "hfcs", "jarabe de maiz"],
    level: 2,
    category: "Azucar procesada",
    reason: "Vinculado a obesidad, resistencia a insulina y enfermedad de higado graso. Mas danino que el azucar comun.",
  },
  {
    names: ["carragenina", "carrageenan", "carragenano", "e407"],
    level: 2,
    category: "Espesante",
    reason: "Causa inflamacion intestinal en estudios animales. Posible vinculo con colitis y cancer de colon.",
  },
  {
    names: ["azodicarbonamida", "azodicarbonamide", "e927a"],
    level: 2,
    category: "Mejorador de harina",
    reason: "Prohibido en UE y Australia. Al hornearse forma semicarbazida (posible carcinogeno).",
  },

  // --- Other concerning ---
  {
    names: ["colorante caramelo iv", "caramel color iv", "e150d", "colorante caramelo"],
    level: 2,
    category: "Colorante",
    reason: "Contiene 4-MEI, clasificado como posible carcinogeno. Presente en colas y salsas oscuras.",
  },
  {
    names: ["saborizante artificial", "artificial flavor", "aroma artificial", "aroma idéntico al natural", "saborizante"],
    level: 2,
    category: "Saborizante",
    reason: "Composicion quimica no transparente. Puede contener docenas de quimicos no listados individualmente.",
  },
  {
    names: ["proteina hidrolizada", "hydrolyzed protein", "proteina vegetal hidrolizada"],
    level: 2,
    category: "Potenciador de sabor",
    reason: "Fuente oculta de MSG. Usado para dar sabor a productos de baja calidad.",
  },

  // ============================================================
  // LEVEL 3 - MILD (processed but generally safe)
  // ============================================================

  {
    names: ["maltodextrina", "maltodextrin"],
    level: 3,
    category: "Carbohidrato procesado",
    reason: "Indice glucemico muy alto (105-136). Puede elevar azucar en sangre rapidamente.",
  },
  {
    names: ["dextrosa", "dextrose"],
    level: 3,
    category: "Azucar",
    reason: "Azucar simple derivada del maiz. Indice glucemico alto.",
  },
  {
    names: ["almidon modificado", "modified starch", "almidón modificado"],
    level: 3,
    category: "Espesante",
    reason: "Procesado quimicamente. Generalmente seguro pero indica alto grado de procesamiento.",
  },
  {
    names: ["lecitina de soya", "soy lecithin", "lecitina", "e322"],
    level: 3,
    category: "Emulsificante",
    reason: "Generalmente seguro. Preocupacion menor si es de soya transgenica.",
  },
  {
    names: ["goma xantana", "xanthan gum", "e415"],
    level: 3,
    category: "Espesante",
    reason: "Generalmente seguro. Puede causar gases e hinchazon en cantidades grandes.",
  },
  {
    names: ["goma guar", "guar gum", "e412"],
    level: 3,
    category: "Espesante",
    reason: "Generalmente seguro. Fibra soluble que puede causar gases.",
  },
  {
    names: ["carboximetilcelulosa", "cellulose gum", "cmc", "e466"],
    level: 3,
    category: "Espesante",
    reason: "Estudios recientes sugieren que puede alterar el microbioma intestinal.",
  },
  {
    names: ["polisorbato 80", "polysorbate 80", "polisorbato", "e433"],
    level: 3,
    category: "Emulsificante",
    reason: "Puede afectar la barrera intestinal y promover inflamacion segun estudios recientes.",
  },
  {
    names: ["mono y digliceridos", "monoglycerides", "diglycerides", "e471"],
    level: 3,
    category: "Emulsificante",
    reason: "Pueden contener grasas trans como subproducto de fabricacion.",
  },
  {
    names: ["acido citrico", "citric acid", "e330"],
    level: 3,
    category: "Acidulante",
    reason: "Generalmente seguro. Naturalmente presente en citricos. La version industrial se produce con moho.",
  },
  {
    names: ["extracto de levadura", "yeast extract"],
    level: 3,
    category: "Saborizante",
    reason: "Fuente natural de glutamato libre. Usado como alternativa 'limpia' al MSG.",
  },
  {
    names: ["fosfato de sodio", "sodium phosphate", "fosfato", "e339", "e340", "e341"],
    level: 3,
    category: "Regulador de acidez",
    reason: "Exceso de fosfatos vinculado a dano renal y problemas cardiovasculares.",
  },
  {
    names: ["aceite de palma", "palm oil", "grasa de palma"],
    level: 3,
    category: "Grasa",
    reason: "Alto en grasa saturada. Impacto ambiental severo (deforestacion).",
  },
];

/**
 * Search for harmful ingredients in a product's ingredient list and additives.
 * Returns matches grouped by severity level.
 */
export interface HarmfulMatch {
  ingredient: HarmfulIngredient;
  matchedName: string;
}

export function findHarmfulIngredients(
  ingredients: string[],
  additives: string[]
): HarmfulMatch[] {
  const combined = [...ingredients, ...additives]
    .join(" ")
    .toLowerCase();

  const matches: HarmfulMatch[] = [];
  const seen = new Set<string>();

  for (const hi of HARMFUL_INGREDIENTS) {
    for (const name of hi.names) {
      if (combined.includes(name.toLowerCase()) && !seen.has(hi.reason)) {
        seen.add(hi.reason);
        matches.push({ ingredient: hi, matchedName: name });
        break;
      }
    }
  }

  // Sort by level (most dangerous first)
  matches.sort((a, b) => a.ingredient.level - b.ingredient.level);
  return matches;
}
