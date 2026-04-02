import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from "react-native-reanimated";
import { useProductStore } from "../stores/useProductStore";
import { getHealthColor, getHealthLabel } from "../constants/theme";
import type { ProductAnalysis } from "../types/product";

export default function ResultsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const analysisResult = useProductStore((s) => s.analysisResult);
  const scannedProducts = useProductStore((s) => s.scannedProducts);
  const reset = useProductStore((s) => s.reset);

  const bg = isDark ? "bg-slate-900" : "bg-gray-50";
  const cardBg = isDark ? "bg-slate-800" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-text-primary";
  const textSecondary = isDark ? "text-slate-400" : "text-text-secondary";
  const borderColor = isDark ? "border-slate-700" : "border-gray-100";

  if (!analysisResult) {
    return (
      <SafeAreaView
        className={`flex-1 ${bg} justify-center items-center px-8`}
      >
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={isDark ? "#64748B" : "#94A3B8"}
        />
        <Text className={`${textSecondary} text-lg mt-4 text-center`}>
          No hay resultados disponibles
        </Text>
        <Pressable
          className="mt-6 bg-primary px-8 py-3 rounded-2xl"
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
    <SafeAreaView className={`flex-1 ${bg}`}>
      {/* Header */}
      <View
        className={`flex-row items-center justify-between px-4 py-3 ${cardBg} border-b ${borderColor}`}
      >
        <Pressable
          onPress={() => router.back()}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#E2E8F0" : "#0F172A"}
          />
        </Pressable>
        <Text className={`text-lg font-semibold ${textPrimary}`}>
          Resultados
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Winner Card */}
        {winner && (
          <Animated.View
            entering={FadeInDown.duration(600).springify()}
            className={`mx-4 mt-4 ${cardBg} rounded-3xl p-6 shadow-md border-2 border-success`}
          >
            <View className="items-center">
              {/* Badge */}
              <Animated.View
                entering={FadeIn.duration(400).delay(300)}
                className="bg-success/10 rounded-full px-5 py-1.5 mb-4"
              >
                <View className="flex-row items-center">
                  <Ionicons name="trophy" size={16} color="#22C55E" />
                  <Text className="text-success font-bold ml-1.5 text-sm">
                    MAS SALUDABLE
                  </Text>
                </View>
              </Animated.View>

              {winnerImage && (
                <Animated.View entering={FadeIn.duration(500).delay(200)}>
                  <Image
                    source={{ uri: winnerImage.imageUri }}
                    className="w-32 h-32 rounded-2xl mb-4"
                    accessibilityLabel={`Producto ganador: ${winner.name}`}
                  />
                </Animated.View>
              )}

              <Text
                className={`text-2xl font-bold ${textPrimary} text-center`}
              >
                {winner.name}
              </Text>
              <Text className={`${textSecondary} text-base mb-4`}>
                {winner.brand}
              </Text>

              {/* Health Score */}
              <Animated.View
                entering={FadeIn.duration(600).delay(400)}
                className="items-center mb-5"
              >
                <View
                  className="w-24 h-24 rounded-full items-center justify-center"
                  style={{
                    backgroundColor:
                      getHealthColor(winner.healthScore) + "20",
                  }}
                >
                  <Text
                    className="text-4xl font-bold"
                    style={{ color: getHealthColor(winner.healthScore) }}
                  >
                    {winner.healthScore}
                  </Text>
                </View>
                <Text
                  className="text-sm font-semibold mt-2"
                  style={{ color: getHealthColor(winner.healthScore) }}
                >
                  {getHealthLabel(winner.healthScore)}
                </Text>
              </Animated.View>

              {/* Pros */}
              {winner.pros.length > 0 && (
                <View className="w-full">
                  {winner.pros.map((pro, i) => (
                    <Animated.View
                      key={i}
                      entering={SlideInRight.duration(300).delay(500 + i * 100)}
                      className="flex-row items-start mb-2"
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#22C55E"
                      />
                      <Text
                        className={`${textPrimary} text-sm ml-2 flex-1`}
                      >
                        {pro}
                      </Text>
                    </Animated.View>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Summary */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(300)}
          className={`mx-4 mt-4 ${isDark ? "bg-blue-500/10" : "bg-blue-50"} rounded-2xl p-4`}
        >
          <View className="flex-row items-start">
            <Ionicons
              name="bulb"
              size={20}
              color={isDark ? "#60A5FA" : "#3B82F6"}
            />
            <Text
              className={`${isDark ? "text-blue-300" : "text-blue-800"} text-sm ml-2 flex-1`}
            >
              {analysisResult.summary}
            </Text>
          </View>
        </Animated.View>

        {/* Ranking */}
        <Text
          className={`text-xs font-semibold ${textSecondary} px-6 mt-6 mb-3 tracking-wider`}
        >
          RANKING COMPLETO
        </Text>

        {sortedProducts.map((product, index) => (
          <Animated.View
            key={product.productId}
            entering={FadeInDown.duration(400).delay(400 + index * 150)}
          >
            <ProductResultCard
              product={product}
              rank={index + 1}
              imageUri={getProductImage(product.productId)}
              isWinner={product.productId === analysisResult.winnerId}
              isDark={isDark}
              cardBg={cardBg}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          </Animated.View>
        ))}

        {/* New Comparison */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(800)}
          className="px-4 py-6"
        >
          <Pressable
            className="bg-primary py-4 rounded-2xl items-center active:opacity-80 shadow-lg"
            onPress={handleNewComparison}
            accessibilityRole="button"
            accessibilityLabel="Iniciar nueva comparacion"
          >
            <View className="flex-row items-center">
              <Ionicons name="refresh" size={20} color="white" />
              <Text className="text-white font-semibold ml-2 text-base">
                Nueva Comparacion
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductResultCard({
  product,
  rank,
  imageUri,
  isWinner,
  isDark,
  cardBg,
  textPrimary,
  textSecondary,
}: {
  product: ProductAnalysis;
  rank: number;
  imageUri?: string;
  isWinner: boolean;
  isDark: boolean;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
}) {
  const healthColor = getHealthColor(product.healthScore);

  return (
    <View
      className={`mx-4 mb-3 ${cardBg} rounded-2xl p-4 ${
        isWinner ? "border border-success/30" : `border ${isDark ? "border-slate-700" : "border-gray-100"}`
      }`}
    >
      <View className="flex-row items-center">
        {/* Rank */}
        <View
          className="w-9 h-9 rounded-full items-center justify-center mr-3"
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
            className="w-14 h-14 rounded-xl mr-3"
            accessibilityLabel={product.name}
          />
        )}

        {/* Info */}
        <View className="flex-1">
          <Text className={`font-semibold ${textPrimary}`}>
            {product.name}
          </Text>
          <Text className={`${textSecondary} text-sm`}>{product.brand}</Text>
        </View>

        {/* Score */}
        <View className="items-center">
          <Text className="text-2xl font-bold" style={{ color: healthColor }}>
            {product.healthScore}
          </Text>
          <Text className="text-xs font-medium" style={{ color: healthColor }}>
            {getHealthLabel(product.healthScore)}
          </Text>
        </View>
      </View>

      {/* Nutrient pills */}
      <View className="flex-row flex-wrap mt-3 gap-2">
        <NutrientPill
          label="Cal"
          value={`${product.nutritionalInfo.calories}`}
          isDark={isDark}
        />
        <NutrientPill
          label="Azucar"
          value={`${product.nutritionalInfo.sugars}g`}
          isDark={isDark}
        />
        <NutrientPill
          label="Sodio"
          value={`${product.nutritionalInfo.sodium}mg`}
          isDark={isDark}
        />
        <NutrientPill
          label="Proteina"
          value={`${product.nutritionalInfo.protein}g`}
          isDark={isDark}
        />
        <NutrientPill
          label="Fibra"
          value={`${product.nutritionalInfo.fiber}g`}
          isDark={isDark}
        />
      </View>

      {/* Warnings */}
      {product.warnings.length > 0 && (
        <View className="mt-3">
          {product.warnings.map((warning, i) => (
            <View key={i} className="flex-row items-start mb-1">
              <Ionicons name="warning" size={14} color="#F59E0B" />
              <Text className={`${textSecondary} text-xs ml-1.5 flex-1`}>
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
              <Text className={`${textSecondary} text-xs ml-1.5 flex-1`}>
                {con}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function NutrientPill({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <View
      className={`${isDark ? "bg-slate-700" : "bg-gray-100"} rounded-full px-3 py-1`}
    >
      <Text
        className={`text-xs ${isDark ? "text-slate-300" : "text-text-secondary"}`}
      >
        <Text
          className={`font-semibold ${isDark ? "text-white" : "text-text-primary"}`}
        >
          {value}
        </Text>{" "}
        {label}
      </Text>
    </View>
  );
}
