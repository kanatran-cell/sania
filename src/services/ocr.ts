import { recognizeText as mlkitRecognize } from "@infinitered/react-native-mlkit-text-recognition";

export async function recognizeText(imageUri: string): Promise<string> {
  const result = await mlkitRecognize(imageUri);
  return result.text;
}
