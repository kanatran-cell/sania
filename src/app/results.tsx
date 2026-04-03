import { View, Text, Pressable, Image, ScrollView, StyleSheet } from "react-native";
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
      <SafeAreaView style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#64748B", fontSize: 18 }}>No hay resultados</Text>
        <Pressable style={[s.newBtn, { marginTop: 24 }]} onPress={() => { reset(); router.replace("/"); }}>
          <Text style={s.newBtnText}>Volver al inicio</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const winner = analysisResult.products.find((p) => p.productId === analysisResult.winnerId);
  const winnerImage = scannedProducts.find((p) => p.id === analysisResult.winnerId);
  const sorted = [...analysisResult.products].sort((a, b) => b.healthScore - a.healthScore);

  function getProductImage(id: string) {
    const p = scannedProducts.find((sp) => sp.id === id);
    return p?.imageUrl || p?.imageUri;
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={s.headerTitle}>Resultados</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Winner Card */}
        {winner && (
          <View style={s.winnerCard}>
            <View style={s.winnerBadge}>
              <Ionicons name="trophy" size={16} color="#22C55E" />
              <Text style={s.winnerBadgeText}>MAS SALUDABLE</Text>
            </View>

            {winnerImage && (winnerImage.imageUrl || winnerImage.imageUri) && (
              <Image source={{ uri: winnerImage.imageUrl || winnerImage.imageUri }} style={s.winnerImage} />
            )}

            <Text style={s.winnerName}>{winner.name}</Text>
            <Text style={s.winnerBrand}>{winner.brand}</Text>

            <View style={[s.scoreCircle, { backgroundColor: getHealthColor(winner.healthScore) + "20" }]}>
              <Text style={[s.scoreText, { color: getHealthColor(winner.healthScore) }]}>{winner.healthScore}</Text>
            </View>
            <Text style={[s.scoreLabel, { color: getHealthColor(winner.healthScore) }]}>
              {getHealthLabel(winner.healthScore)}
            </Text>

            {winner.pros.map((pro, i) => (
              <View key={i} style={s.proRow}>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={s.proText}>{pro}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        <View style={s.summaryBox}>
          <Ionicons name="bulb" size={20} color="#3B82F6" />
          <Text style={s.summaryText}>{analysisResult.summary}</Text>
        </View>

        {/* Ranking */}
        <Text style={s.sectionLabel}>RANKING COMPLETO</Text>

        {sorted.map((product, index) => (
          <ProductCard
            key={product.productId}
            product={product}
            rank={index + 1}
            imageUri={getProductImage(product.productId)}
            isWinner={product.productId === analysisResult.winnerId}
          />
        ))}

        {/* New Comparison */}
        <View style={{ padding: 16, paddingBottom: 32 }}>
          <Pressable style={s.newBtn} onPress={() => { reset(); router.replace("/"); }}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={s.newBtnText}>Nueva Comparacion</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductCard({ product, rank, imageUri, isWinner }: {
  product: ProductAnalysis; rank: number; imageUri?: string; isWinner: boolean;
}) {
  const color = getHealthColor(product.healthScore);
  return (
    <View style={[s.card, isWinner && { borderColor: "#22C55E40", borderWidth: 1 }]}>
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
          <Text style={[s.cardScoreLabel, { color }]}>{getHealthLabel(product.healthScore)}</Text>
        </View>
      </View>

      <View style={s.pillsRow}>
        <Pill label="Cal" value={`${product.nutritionalInfo.calories}`} />
        <Pill label="Azucar" value={`${product.nutritionalInfo.sugars}g`} />
        <Pill label="Sodio" value={`${product.nutritionalInfo.sodium}mg`} />
        <Pill label="Proteina" value={`${product.nutritionalInfo.protein}g`} />
      </View>

      {product.warnings.map((w, i) => (
        <View key={i} style={s.warningRow}>
          <Ionicons name="warning" size={14} color="#F59E0B" />
          <Text style={s.warningText}>{w}</Text>
        </View>
      ))}
      {product.cons.map((c, i) => (
        <View key={i} style={s.warningRow}>
          <Ionicons name="close-circle" size={14} color="#EF4444" />
          <Text style={s.warningText}>{c}</Text>
        </View>
      ))}
    </View>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.pill}>
      <Text style={s.pillValue}>{value}</Text>
      <Text style={s.pillLabel}> {label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#0F172A" },
  winnerCard: { margin: 16, backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center", borderWidth: 2, borderColor: "#22C55E" },
  winnerBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#22C55E10", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 16 },
  winnerBadgeText: { color: "#22C55E", fontWeight: "bold", marginLeft: 6, fontSize: 13 },
  winnerImage: { width: 128, height: 128, borderRadius: 16, marginBottom: 16 },
  winnerName: { fontSize: 22, fontWeight: "bold", color: "#0F172A", textAlign: "center" },
  winnerBrand: { color: "#64748B", fontSize: 16, marginBottom: 16 },
  scoreCircle: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  scoreText: { fontSize: 40, fontWeight: "bold" },
  scoreLabel: { fontSize: 14, fontWeight: "600", marginBottom: 16 },
  proRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6, width: "100%" },
  proText: { color: "#0F172A", fontSize: 14, marginLeft: 8, flex: 1 },
  summaryBox: { marginHorizontal: 16, marginTop: 16, backgroundColor: "#EFF6FF", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "flex-start" },
  summaryText: { color: "#1E40AF", fontSize: 14, marginLeft: 8, flex: 1 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#64748B", paddingHorizontal: 24, marginTop: 24, marginBottom: 12, letterSpacing: 1 },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F1F5F9" },
  cardRow: { flexDirection: "row", alignItems: "center" },
  rankCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 12 },
  rankText: { fontWeight: "bold", fontSize: 13 },
  cardImage: { width: 56, height: 56, borderRadius: 12, marginRight: 12 },
  cardName: { fontWeight: "600", color: "#0F172A" },
  cardBrand: { color: "#64748B", fontSize: 13 },
  cardScore: { fontSize: 24, fontWeight: "bold" },
  cardScoreLabel: { fontSize: 11, fontWeight: "500" },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 8 },
  pill: { flexDirection: "row", backgroundColor: "#F1F5F9", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  pillValue: { fontSize: 12, fontWeight: "600", color: "#0F172A" },
  pillLabel: { fontSize: 12, color: "#64748B" },
  warningRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 6 },
  warningText: { color: "#64748B", fontSize: 12, marginLeft: 6, flex: 1 },
  newBtn: { backgroundColor: "#6366F1", paddingVertical: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  newBtnText: { color: "#fff", fontWeight: "600", fontSize: 16, marginLeft: 8 },
});
