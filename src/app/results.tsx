import { View, Text, Pressable, Image, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProductStore } from "../stores/useProductStore";
import { getHealthColor, getHealthLabel } from "../constants/theme";
import type { ProductAnalysis } from "../types/product";
import type { IngredientAnalysis } from "../services/analyzer";
import type { HarmfulMatch } from "../constants/harmfulIngredients";

const CLASSIFICATION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  natural: { label: "Natural", color: "#15803D", bg: "#F0FDF4", icon: "leaf" },
  minimal: { label: "Minimamente procesado", color: "#CA8A04", bg: "#FEFCE8", icon: "checkmark-circle" },
  processed: { label: "Procesado", color: "#EA580C", bg: "#FFF7ED", icon: "alert-circle" },
  ultra_processed: { label: "Ultra-procesado", color: "#DC2626", bg: "#FEF2F2", icon: "skull" },
};

const LEVEL_CONFIG = {
  1: { label: "PELIGROSO", color: "#DC2626", bg: "#FEF2F2", icon: "skull" as keyof typeof Ionicons.glyphMap },
  2: { label: "PREOCUPANTE", color: "#EA580C", bg: "#FFF7ED", icon: "warning" as keyof typeof Ionicons.glyphMap },
  3: { label: "LEVE", color: "#CA8A04", bg: "#FEFCE8", icon: "information-circle" as keyof typeof Ionicons.glyphMap },
};

export default function ResultsScreen() {
  const router = useRouter();
  const analysisResult = useProductStore((s) => s.analysisResult);
  const scannedProducts = useProductStore((s) => s.scannedProducts);
  const reset = useProductStore((s) => s.reset);

  if (!analysisResult) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#64748B", fontSize: 18 }}>No hay resultados</Text>
        <Pressable style={[s.actionBtn, { marginTop: 24 }]} onPress={() => { reset(); router.replace("/"); }}>
          <Text style={s.actionBtnText}>Volver al inicio</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const sorted = [...analysisResult.products].sort((a, b) => b.healthScore - a.healthScore);
  const winner = sorted[0];
  const winnerScanned = scannedProducts.find((p) => p.id === winner.productId);

  function getProductImage(id: string) {
    const p = scannedProducts.find((sp) => sp.id === id);
    return p?.imageUrl || p?.imageUri;
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={s.headerTitle}>Resultados</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Winner */}
        <View style={s.winnerCard}>
          <View style={s.winnerBadge}>
            <Ionicons name="trophy" size={16} color="#15803D" />
            <Text style={s.winnerBadgeText}>MEJOR OPCION</Text>
          </View>

          {winnerScanned && (winnerScanned.imageUrl || winnerScanned.imageUri) && (
            <Image source={{ uri: winnerScanned.imageUrl || winnerScanned.imageUri }} style={s.winnerImage} />
          )}

          <Text style={s.winnerName}>{winner.name}</Text>
          <Text style={s.winnerBrand}>{winner.brand}</Text>

          {winner.ingredientAnalysis && (
            <ClassBadge ia={winner.ingredientAnalysis as IngredientAnalysis} />
          )}

          {winner.ingredientAnalysis && (
            <Text style={s.verdictText}>{(winner.ingredientAnalysis as IngredientAnalysis).verdict}</Text>
          )}

          <View style={[s.scoreCircle, { backgroundColor: getHealthColor(winner.healthScore) + "20" }]}>
            <Text style={[s.scoreText, { color: getHealthColor(winner.healthScore) }]}>{winner.healthScore}</Text>
          </View>
          <Text style={[s.scoreLabel, { color: getHealthColor(winner.healthScore) }]}>
            {getHealthLabel(winner.healthScore)}
          </Text>
        </View>

        {/* Comparison */}
        <Text style={s.sectionLabel}>COMPARACION DETALLADA</Text>

        {sorted.map((product, index) => (
          <ProductCard
            key={product.productId}
            product={product}
            rank={index + 1}
            imageUri={getProductImage(product.productId)}
            isWinner={index === 0}
          />
        ))}

        {/* Actions */}
        <View style={{ padding: 16, paddingBottom: 32, gap: 12 }}>
          <Pressable style={s.actionBtn} onPress={() => { reset(); router.replace("/scan"); }}>
            <Ionicons name="scan" size={20} color="white" />
            <Text style={s.actionBtnText}>Nueva Comparacion</Text>
          </Pressable>
          <Pressable style={s.homeBtn} onPress={() => { reset(); router.replace("/"); }}>
            <Ionicons name="home" size={20} color="#6366F1" />
            <Text style={s.homeBtnText}>Volver al Inicio</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ClassBadge({ ia }: { ia: IngredientAnalysis }) {
  const cls = CLASSIFICATION_CONFIG[ia.classification] || CLASSIFICATION_CONFIG.processed;
  return (
    <View style={[s.classBadge, { backgroundColor: cls.bg }]}>
      <Ionicons name={cls.icon} size={16} color={cls.color} />
      <Text style={[s.classBadgeText, { color: cls.color }]}>{cls.label}</Text>
    </View>
  );
}

function ProductCard({ product, rank, imageUri, isWinner }: {
  product: ProductAnalysis; rank: number; imageUri?: string; isWinner: boolean;
}) {
  const color = getHealthColor(product.healthScore);
  const ia = product.ingredientAnalysis as IngredientAnalysis | undefined;

  return (
    <View style={[s.card, isWinner && { borderColor: "#22C55E60", borderWidth: 2 }]}>
      {/* Header */}
      <View style={s.cardRow}>
        <View style={[s.rankCircle, { backgroundColor: color + "20" }]}>
          <Text style={[s.rankText, { color }]}>#{rank}</Text>
        </View>
        {imageUri && <Image source={{ uri: imageUri }} style={s.cardImage} />}
        <View style={{ flex: 1 }}>
          <Text style={s.cardName}>{product.name}</Text>
          <Text style={s.cardBrand}>{product.brand}</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={[s.cardScore, { color }]}>{product.healthScore}</Text>
        </View>
      </View>

      {/* Classification + Verdict */}
      {ia && <ClassBadge ia={ia} />}
      {ia && <Text style={s.cardVerdict}>{ia.verdict}</Text>}

      {/* Harmful ingredients by level */}
      {ia && ia.harmfulMatches.length > 0 && (
        <View style={s.harmfulSection}>
          <Text style={s.harmfulTitle}>Ingredientes detectados:</Text>
          {ia.harmfulMatches.map((match: HarmfulMatch, i: number) => {
            const lvl = LEVEL_CONFIG[match.ingredient.level];
            return (
              <View key={i} style={[s.harmfulItem, { backgroundColor: lvl.bg }]}>
                <View style={s.harmfulHeader}>
                  <Ionicons name={lvl.icon} size={16} color={lvl.color} />
                  <Text style={[s.harmfulLevel, { color: lvl.color }]}>{lvl.label}</Text>
                  <Text style={s.harmfulCategory}>{match.ingredient.category}</Text>
                </View>
                <Text style={s.harmfulReason}>{match.ingredient.reason}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Pros */}
      {product.pros.map((pro, i) => (
        <View key={`pro-${i}`} style={s.badgeRow}>
          <Ionicons name="checkmark-circle" size={14} color="#15803D" />
          <Text style={[s.badgeText, { color: "#15803D" }]}>{pro}</Text>
        </View>
      ))}

      {/* Ingredients list */}
      {product.nutritionalInfo.ingredients.length > 0 && (
        <View style={s.ingredientsList}>
          <Text style={s.ingredientsTitle}>Ingredientes:</Text>
          <Text style={s.ingredientsText}>
            {product.nutritionalInfo.ingredients.join(", ")}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#0F172A" },
  winnerCard: { margin: 16, backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center", borderWidth: 2, borderColor: "#22C55E" },
  winnerBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 16 },
  winnerBadgeText: { color: "#15803D", fontWeight: "bold", marginLeft: 6, fontSize: 13 },
  winnerImage: { width: 120, height: 120, borderRadius: 16, marginBottom: 12 },
  winnerName: { fontSize: 22, fontWeight: "bold", color: "#0F172A", textAlign: "center" },
  winnerBrand: { color: "#64748B", fontSize: 15, marginBottom: 8 },
  verdictText: { color: "#374151", fontSize: 14, textAlign: "center", marginVertical: 12, lineHeight: 20 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginTop: 4 },
  scoreText: { fontSize: 32, fontWeight: "bold" },
  scoreLabel: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#64748B", paddingHorizontal: 24, marginTop: 20, marginBottom: 12, letterSpacing: 1 },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F1F5F9" },
  cardRow: { flexDirection: "row", alignItems: "center" },
  rankCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 12 },
  rankText: { fontWeight: "bold", fontSize: 13 },
  cardImage: { width: 52, height: 52, borderRadius: 10, marginRight: 12 },
  cardName: { fontWeight: "600", color: "#0F172A", fontSize: 15 },
  cardBrand: { color: "#64748B", fontSize: 13 },
  cardScore: { fontSize: 24, fontWeight: "bold" },
  cardVerdict: { fontSize: 13, color: "#374151", marginTop: 8, lineHeight: 18 },
  classBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10, gap: 5 },
  classBadgeText: { fontWeight: "600", fontSize: 12 },
  // Harmful ingredients
  harmfulSection: { marginTop: 12 },
  harmfulTitle: { fontSize: 12, fontWeight: "600", color: "#64748B", marginBottom: 8 },
  harmfulItem: { borderRadius: 10, padding: 10, marginBottom: 6 },
  harmfulHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  harmfulLevel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  harmfulCategory: { fontSize: 12, fontWeight: "600", color: "#374151" },
  harmfulReason: { fontSize: 12, color: "#4B5563", lineHeight: 17 },
  // Pros
  badgeRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 6, gap: 6 },
  badgeText: { fontSize: 13, flex: 1, lineHeight: 18 },
  // Ingredients
  ingredientsList: { marginTop: 12, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12 },
  ingredientsTitle: { fontSize: 12, fontWeight: "600", color: "#64748B", marginBottom: 4 },
  ingredientsText: { fontSize: 12, color: "#374151", lineHeight: 18 },
  // Buttons
  actionBtn: { backgroundColor: "#6366F1", paddingVertical: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#fff", fontWeight: "600", fontSize: 16, marginLeft: 8 },
  homeBtn: { paddingVertical: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#6366F1" },
  homeBtnText: { color: "#6366F1", fontWeight: "600", fontSize: 16, marginLeft: 8 },
});
