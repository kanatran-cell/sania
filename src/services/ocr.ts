import { recognizeText as mlkitRecognize } from "@infinitered/react-native-mlkit-text-recognition";

export async function recognizeText(imageUri: string): Promise<string> {
  try {
    console.log("[SanIA OCR] Starting recognition for:", imageUri);
    const result = await mlkitRecognize(imageUri);
    console.log("[SanIA OCR] Success, text length:", result.text.length);
    return result.text;
  } catch (error) {
    console.error("[SanIA OCR] Error:", error);
    return "";
  }
}
