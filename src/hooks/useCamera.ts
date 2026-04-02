import * as ImagePicker from "expo-image-picker";
import { v4 as uuidv4 } from "uuid";
import type { ScannedProduct } from "../types/product";

export function useCamera() {
  const [permissionStatus, requestPermission] =
    ImagePicker.useCameraPermissions();

  const captureProduct = async (): Promise<ScannedProduct | null> => {
    if (!permissionStatus?.granted) {
      const result = await requestPermission();
      if (!result.granted) return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: true,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    return {
      id: uuidv4(),
      imageUri: asset.uri,
      imageBase64: asset.base64 ?? undefined,
      timestamp: Date.now(),
    };
  };

  return { captureProduct, permissionStatus, requestPermission };
}
