import { View, Text, Pressable, FlatList, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCamera } from "../hooks/useCamera";
import { useProductAnalysis } from "../hooks/useProductAnalysis";
import { useProductStore } from "../stores/useProductStore";
import type { ScannedProduct } from "../types/product";

export default function ScanScreen() {
  const router = useRouter();
  const { captureProduct } = useCamera();
  const analysis = useProductAnalysis();

  const scannedProducts = useProductStore((s) => s.scannedProducts);
  const addProduct = useProductStore((s) => s.addProduct);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const isAnalyzing = useProductStore((s) => s.isAnalyzing);

  const canCompare = scannedProducts.length >= 2;

  async function handleCapture() {
    try {
      const product = await captureProduct();
      if (product) {
        addProduct(product);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Error", "No se pudo capturar la imagen. Intenta de nuevo.");
    }
  }

  function handleCompare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    analysis.mutate(undefined, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push("/results");
      },
      onError: (error) => {
        Alert.alert(
          "Error",
          "No se pudieron analizar los productos. Verifica tu conexión e intenta de nuevo."
        );
      },
    });
  }

  function handleRemove(id: string) {
    removeProduct(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function renderProduct({ item }: { item: ScannedProduct }) {
    return (
      <View className="mr-3 items-center">
        <View className="relative">
          <Image
            source={{ uri: item.imageUri }}
            className="w-24 h-24 rounded-xl"
            accessibilityLabel={`Producto escaneado`}
          />
          <Pressable
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
            onPress={() => handleRemove(item.id)}
            accessibilityRole="button"
            accessibilityLabel="Eliminar producto"
          >
            <Ionicons name="close" size={14} color="white" />
          </Pressable>
        </View>
        <Text className="text-xs text-text-secondary mt-1">
          #{scannedProducts.indexOf(item) + 1}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel="Volver al inicio"
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </Pressable>
        <Text className="text-lg font-semibold text-text-primary">
          Escanear Productos
        </Text>
        <View className="w-10" />
      </View>

      <View className="flex-1">
        {/* Área principal */}
        <View className="flex-1 justify-center items-center px-8">
          {scannedProducts.length === 0 ? (
            <View className="items-center">
              <View className="w-32 h-32 bg-primary/5 rounded-full items-center justify-center mb-6">
                <Ionicons name="camera" size={56} color="#6366F1" />
              </View>
              <Text className="text-xl font-semibold text-text-primary mb-2 text-center">
                Escanea tu primer producto
              </Text>
              <Text className="text-text-secondary text-center mb-8">
                Toma una foto de la etiqueta nutricional{"\n"}o del frente del
                producto
              </Text>
            </View>
          ) : (
            <View className="items-center">
              <Text className="text-6xl font-bold text-primary mb-2">
                {scannedProducts.length}
              </Text>
              <Text className="text-text-secondary text-lg mb-2">
                {scannedProducts.length === 1
                  ? "producto escaneado"
                  : "productos escaneados"}
              </Text>
              {!canCompare && (
                <Text className="text-warning text-sm">
                  Necesitas al menos 2 productos para comparar
                </Text>
              )}
            </View>
          )}

          {/* Botón de captura */}
          <Pressable
            className="w-20 h-20 bg-primary rounded-full items-center justify-center mt-8 active:opacity-80 shadow-lg"
            onPress={handleCapture}
            disabled={isAnalyzing}
            accessibilityRole="button"
            accessibilityLabel="Tomar foto del producto"
          >
            <Ionicons name="camera" size={32} color="white" />
          </Pressable>
          <Text className="text-text-secondary text-sm mt-3">
            Toca para escanear
          </Text>
        </View>

        {/* Lista de productos escaneados */}
        {scannedProducts.length > 0 && (
          <View className="border-t border-gray-100 pt-4 pb-2">
            <Text className="text-sm font-medium text-text-secondary px-6 mb-3">
              PRODUCTOS ESCANEADOS
            </Text>
            <FlatList
              data={scannedProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            />
          </View>
        )}

        {/* Botón comparar */}
        <View className="px-6 pb-4">
          <Pressable
            className={`py-4 rounded-xl items-center ${
              canCompare && !isAnalyzing
                ? "bg-success active:opacity-80"
                : "bg-gray-200"
            }`}
            onPress={handleCompare}
            disabled={!canCompare || isAnalyzing}
            accessibilityRole="button"
            accessibilityLabel="Comparar productos"
            accessibilityState={{ disabled: !canCompare || isAnalyzing }}
          >
            {isAnalyzing ? (
              <View className="flex-row items-center">
                <Ionicons name="hourglass" size={20} color="#64748B" />
                <Text className="text-text-secondary font-semibold ml-2">
                  Analizando...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons
                  name="trophy"
                  size={20}
                  color={canCompare ? "white" : "#94A3B8"}
                />
                <Text
                  className={`font-semibold ml-2 ${
                    canCompare ? "text-white" : "text-gray-400"
                  }`}
                >
                  Comparar ({scannedProducts.length})
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
