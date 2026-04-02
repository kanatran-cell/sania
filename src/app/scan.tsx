import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  ZoomIn,
  ZoomOut,
  LinearTransition,
} from "react-native-reanimated";
import { useCamera } from "../hooks/useCamera";
import { useProductAnalysis } from "../hooks/useProductAnalysis";
import { useProductStore } from "../stores/useProductStore";
import type { ScannedProduct } from "../types/product";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ScanScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { captureProduct } = useCamera();
  const analysis = useProductAnalysis();

  const scannedProducts = useProductStore((s) => s.scannedProducts);
  const addProduct = useProductStore((s) => s.addProduct);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const isAnalyzing = useProductStore((s) => s.isAnalyzing);

  const canCompare = scannedProducts.length >= 2;

  const bg = isDark ? "bg-slate-900" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-text-primary";
  const textSecondary = isDark ? "text-slate-400" : "text-text-secondary";
  const borderColor = isDark ? "border-slate-700" : "border-gray-100";
  const iconColor = isDark ? "#E2E8F0" : "#0F172A";

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
      onError: () => {
        Alert.alert(
          "Error",
          "No se pudieron analizar los productos. Verifica tu conexion e intenta de nuevo."
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
      <Animated.View
        entering={ZoomIn.duration(300).springify()}
        exiting={ZoomOut.duration(200)}
        layout={LinearTransition.springify()}
        className="mr-3 items-center"
      >
        <View className="relative">
          <Image
            source={{ uri: item.imageUri }}
            className="w-24 h-24 rounded-xl"
            accessibilityLabel="Producto escaneado"
          />
          <Pressable
            className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full items-center justify-center shadow-sm"
            onPress={() => handleRemove(item.id)}
            accessibilityRole="button"
            accessibilityLabel="Eliminar producto"
          >
            <Ionicons name="close" size={14} color="white" />
          </Pressable>
        </View>
        <Text className={`text-xs ${textSecondary} mt-1`}>
          #{scannedProducts.indexOf(item) + 1}
        </Text>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${bg}`}>
      {/* Header */}
      <View
        className={`flex-row items-center justify-between px-4 py-3 border-b ${borderColor}`}
      >
        <Pressable
          onPress={() => router.back()}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel="Volver al inicio"
        >
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </Pressable>
        <Text className={`text-lg font-semibold ${textPrimary}`}>
          Escanear Productos
        </Text>
        <View className="w-10" />
      </View>

      <View className="flex-1">
        {/* Main area */}
        <View className="flex-1 justify-center items-center px-8">
          {scannedProducts.length === 0 ? (
            <Animated.View
              entering={FadeIn.duration(400)}
              className="items-center"
            >
              <View
                className={`w-32 h-32 ${isDark ? "bg-indigo-500/10" : "bg-primary/5"} rounded-full items-center justify-center mb-6`}
              >
                <Ionicons
                  name="camera"
                  size={56}
                  color={isDark ? "#818CF8" : "#6366F1"}
                />
              </View>
              <Text
                className={`text-xl font-semibold ${textPrimary} mb-2 text-center`}
              >
                Escanea tu primer producto
              </Text>
              <Text className={`${textSecondary} text-center mb-8`}>
                Toma una foto de la etiqueta nutricional{"\n"}o del frente del
                producto
              </Text>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="items-center"
            >
              <Text className="text-6xl font-bold text-primary mb-2">
                {scannedProducts.length}
              </Text>
              <Text className={`${textSecondary} text-lg mb-2`}>
                {scannedProducts.length === 1
                  ? "producto escaneado"
                  : "productos escaneados"}
              </Text>
              {!canCompare && (
                <Animated.Text
                  entering={FadeInDown.duration(300)}
                  className="text-warning text-sm"
                >
                  Necesitas al menos 2 para comparar
                </Animated.Text>
              )}
            </Animated.View>
          )}

          {/* Capture button */}
          <AnimatedPressable
            entering={FadeInDown.duration(500).delay(200).springify()}
            className="w-20 h-20 bg-primary rounded-full items-center justify-center mt-8 active:opacity-80 shadow-xl"
            onPress={handleCapture}
            disabled={isAnalyzing}
            accessibilityRole="button"
            accessibilityLabel="Tomar foto del producto"
          >
            <Ionicons name="camera" size={32} color="white" />
          </AnimatedPressable>
          <Text className={`${textSecondary} text-sm mt-3`}>
            Toca para escanear
          </Text>
        </View>

        {/* Scanned products list */}
        {scannedProducts.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            className={`border-t ${borderColor} pt-4 pb-2`}
          >
            <Text
              className={`text-xs font-semibold ${textSecondary} px-6 mb-3 tracking-wider`}
            >
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
          </Animated.View>
        )}

        {/* Compare button */}
        <View className="px-6 pb-4 pt-2">
          <Pressable
            className={`py-4 rounded-2xl items-center ${
              canCompare && !isAnalyzing
                ? "bg-success active:opacity-80 shadow-lg"
                : isDark
                  ? "bg-slate-800"
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
                <ActivityIndicator size="small" color="#64748B" />
                <Text className={`${textSecondary} font-semibold ml-2`}>
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
                  className={`font-semibold ml-2 text-base ${
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
