import { View, Text, Pressable, FlatList, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProductStore } from "../stores/useProductStore";
import { getHealthColor, getHealthLabel } from "../constants/theme";
import type { ProductAnalysis } from "../types/product";

export default function ResultsScreen() {
  const router = useRouter();
  const analysisResult = useProductStore((s) => s.analysisResult);
  const scannedProducts = useProductStore((s) => s.scannedProducts);
  const reset = useProductStore((s) => s.reset);

  if (!analysisResult) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-text-secondary text-lg">
          No hay resultados disponibles
        </Text>
        <Pressable
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
          onPress={() => router.replace("/")}
        >
          <Text className="text-white font-semibold">Volver al inicio</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const winner = analysisResult.products.find(
    (p) => p.productId === analysisResult.winnerId
  );
  const winnerImage = scannedProducts.find(
    (p) => p.id === analysisResult.winnerId
  );
  const sortedProducts = [...analysisResult.products].sort(
    (a, b) => b.healthScore - a.healthScore
  );

  function handleNewComparison() {
    reset();
    router.replace("/");
  }

  function getProductImage(productId: string) {
    return scannedProducts.find((p) => p.id === productId)?.imageUri;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </Pressable>
        <Text className="text-lg font-semibold text-text-primary">
          Resultados
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Winner Card */}
        {winner && (
          <View className="mx-4 mt-4 bg-white rounded-2xl p-6 shadow-sm border-2 border-success">
            <View className="items-center">
              <View className="bg-success/10 rounded-full px-4 py-1 mb-4">
                <View className="flex-row items-center">
                  <Ionicons name="trophy" size={16} color="#22C55E" />
                  <Text className="text-success font-bold ml-1">
                    MÁS SALUDABLE
                  </Text>
                </View>
              </View>

              {winnerImage && (
                <Image
                  source={{ uri: winnerImage.imageUri }}
                  className="w-28 h-28 rounded-xl mb-4"
                  accessibilityLabel={`Producto ganador: ${winner.name}`}
                />
              )}

              <Text className="text-2xl font-bold text-text-primary text-center">
                {winner.name}
              </Text>
              <Text className="text-text-secondary text-base mb-4">
                {winner.brand}
              </Text>

              {/* Health Score */}
              <View className="items-center mb-4">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{ backgroundColor: getHealthColor(winner.healthScore) + "20" }}
                >
                  <Text
                    className="text-3xl font-bold"
                    style={{ color: getHealthColor(winner.healthScore) }}
                  >
                    {winner.healthScore}
                  </Text>
                </View>
                <Text
                  className="text-sm font-medium mt-1"
                  style={{ color: getHealthColor(winner.healthScore) }}
                >
                  {getHealthLabel(winner.healthScore)}
                </Text>
              </View>

              {/* Pros */}
              {winner.pros.length > 0 && (
                <View className="w-full">
                  {winner.pros.map((pro, i) => (
                    <View key={i} className="flex-row items-start mb-1">
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#22C55E"
                      />
                      <Text className="text-text-primary text-sm ml-2 flex-1">
                        {pro}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Summary */}
        <View className="mx-4 mt-4 bg-blue-50 rounded-xl p-4">
          <View className="flex-row items-start">
            <Ionicons name="bulb" size={20} color="#3B82F6" />
            <Text className="text-blue-800 text-sm ml-2 flex-1">
              {analysisResult.summary}
            </Text>
          </View>
        </View>

        {/* All Products Ranking */}
        <Text className="text-sm font-medium text-text-secondary px-6 mt-6 mb-3">
          RANKING COMPLETO
        </Text>

        {sortedProducts.map((product, index) => (
          <ProductResultCard
            key={product.productId}
            product={product}
            rank={index + 1}
            imageUri={getProductImage(product.productId)}
            isWinner={product.productId === analysisResult.winnerId}
          />
        ))}

        {/* New Comparison Button */}
        <View className="px-4 py-6">
          <Pressable
            className="bg-primary py-4 rounded-xl items-center active:opacity-80"
            onPress={handleNewComparison}
            accessibilityRole="button"
            accessibilityLabel="Iniciar nueva comparación"
          >
            <View className="flex-row items-center">
              <Ionicons name="refresh" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Nueva Comparación
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductResultCard({
  product,
  rank,
  imageUri,
  isWinner,
}: {
  product: ProductAnalysis;
  rank: number;
  imageUri?: string;
  isWinner: boolean;
}) {
  const healthColor = getHealthColor(product.healthScore);

  return (
    <View
      className={`mx-4 mb-3 bg-white rounded-xl p-4 ${
        isWinner ? "border border-success/30" : "border border-gray-100"
      }`}
    >
      <View className="flex-row items-center">
        {/* Rank */}
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: healthColor + "20" }}
        >
          <Text className="font-bold text-sm" style={{ color: healthColor }}>
            #{rank}
          </Text>
        </View>

        {/* Image */}
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            className="w-14 h-14 rounded-lg mr-3"
            accessibilityLabel={product.name}
          />
        )}

        {/* Info */}
        <View className="flex-1">
          <Text className="font-semibold text-text-primary">
            {product.name}
          </Text>
          <Text className="text-text-secondary text-sm">{product.brand}</Text>
        </View>

        {/* Score */}
        <View className="items-center">
          <Text className="text-2xl font-bold" style={{ color: healthColor }}>
            {product.healthScore}
          </Text>
          <Text className="text-xs" style={{ color: healthColor }}>
            {getHealthLabel(product.healthScore)}
          </Text>
        </View>
      </View>

      {/* Nutritional highlights */}
      <View className="flex-row flex-wrap mt-3 gap-2">
        <NutrientPill
          label="Cal"
          value={`${product.nutritionalInfo.calories}`}
        />
        <NutrientPill
          label="Azúcar"
          value={`${product.nutritionalInfo.sugars}g`}
        />
        <NutrientPill
          label="Sodio"
          value={`${product.nutritionalInfo.sodium}mg`}
        />
        <NutrientPill
          label="Proteína"
          value={`${product.nutritionalInfo.protein}g`}
        />
      </View>

      {/* Warnings */}
      {product.warnings.length > 0 && (
        <View className="mt-3">
          {product.warnings.map((warning, i) => (
            <View key={i} className="flex-row items-start mb-1">
              <Ionicons name="warning" size={14} color="#F59E0B" />
              <Text className="text-text-secondary text-xs ml-1 flex-1">
                {warning}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Cons */}
      {product.cons.length > 0 && (
        <View className="mt-2">
          {product.cons.map((con, i) => (
            <View key={i} className="flex-row items-start mb-1">
              <Ionicons name="close-circle" size={14} color="#EF4444" />
              <Text className="text-text-secondary text-xs ml-1 flex-1">
                {con}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function NutrientPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-gray-100 rounded-full px-3 py-1">
      <Text className="text-xs text-text-secondary">
        <Text className="font-medium text-text-primary">{value}</Text> {label}
      </Text>
    </View>
  );
}
