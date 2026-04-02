import TextRecognition, {
  TextRecognitionResult,
} from "@react-native-ml-kit/text-recognition";

export async function recognizeText(imageUri: string): Promise<string> {
  const result: TextRecognitionResult =
    await TextRecognition.recognize(imageUri);
  return result.text;
}
