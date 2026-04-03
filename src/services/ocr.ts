import { recognizeText as mlkitRecognize } from "@infinitered/react-native-mlkit-text-recognition";

/**
 * Extract the most prominent text from a product photo.
 * Returns the best candidate for a product name search query.
 */
export async function extractProductName(imageUri: string): Promise<string> {
  try {
    const result = await mlkitRecognize(imageUri);
    console.log("[SanIA OCR] Full text:", result.text.substring(0, 300));

    if (!result.blocks || result.blocks.length === 0) {
      return result.text.split("\n")[0]?.trim() || "";
    }

    // Sort blocks by size (area) - larger text is usually the product name
    const scored = result.blocks
      .filter((b) => {
        const text = b.text.trim();
        // Skip very short text, numbers, and common label words
        if (text.length < 3) return false;
        if (/^\d+[.,]?\d*\s*(g|mg|ml|kcal|%)?$/.test(text)) return false;
        if (/informaci[oó]n\s*nutricional|ingredientes|tabla|porci[oó]n|contenido|hecho\s*en|fabricado|elaborado|conserv|manteng|lote|exp|caduc|peso\s*neto|net\s*wt/i.test(text)) return false;
        return true;
      })
      .map((b) => {
        const width = b.frame.right - b.frame.left;
        const height = b.frame.bottom - b.frame.top;
        const area = width * height;
        return { text: b.text.trim(), area };
      })
      .sort((a, b) => b.area - a.area);

    console.log("[SanIA OCR] Top blocks:", scored.slice(0, 5).map((s) => `"${s.text}" (${s.area})`));

    // Take the largest text block as the likely product name
    if (scored.length > 0) {
      // Combine top 1-2 largest blocks if they make sense together
      let query = scored[0].text;
      if (scored.length > 1 && scored[1].area > scored[0].area * 0.5) {
        query = `${scored[0].text} ${scored[1].text}`;
      }
      // Clean up: remove special chars, limit length
      return query.replace(/[®™©#@*]/g, "").substring(0, 60).trim();
    }

    return result.text.split("\n")[0]?.trim().substring(0, 60) || "";
  } catch (error) {
    console.warn("[SanIA OCR] Error:", error);
    return "";
  }
}
