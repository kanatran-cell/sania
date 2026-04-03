import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        {/* Logo */}
        <View style={s.logoBox}>
          <View style={s.logoCircle}>
            <Ionicons name="shield-checkmark" size={48} color="#fff" />
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>SanIA</Text>
        <Text style={s.tagline}>Tu detective de alimentos</Text>
        <Text style={s.subtitle}>
          Escanea, compara y descubre que hay{"\n"}realmente dentro de lo que comes
        </Text>

        {/* Feature cards */}
        <View style={s.featuresWrap}>
          <FeatureCard
            icon="barcode-outline"
            title="Escanea"
            desc="Codigo de barras o busqueda manual"
          />
          <FeatureCard
            icon="flask-outline"
            title="Analiza"
            desc="Detecta ingredientes nocivos y aditivos"
          />
          <FeatureCard
            icon="trophy-outline"
            title="Compara"
            desc="Descubre cual es la opcion mas sana"
          />
        </View>

        {/* CTA */}
        <Pressable style={s.ctaBtn} onPress={() => router.push("/scan")}>
          <Ionicons name="scan" size={22} color="#fff" />
          <Text style={s.ctaText}>Empezar a Comparar</Text>
        </Pressable>

        {/* Footer */}
        <Text style={s.footer}>
          Datos de Open Food Facts + base de ingredientes nocivos{"\n"}basada en IARC, EFSA y CSPI
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FeatureCard({ icon, title, desc }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}) {
  return (
    <View style={s.featureCard}>
      <View style={s.featureIcon}>
        <Ionicons name={icon} size={24} color="#6366F1" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.featureTitle}>{title}</Text>
        <Text style={s.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  logoBox: { alignItems: "center", marginBottom: 20 },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  title: { fontSize: 40, fontWeight: "bold", color: "#0F172A", textAlign: "center" },
  tagline: { fontSize: 16, color: "#6366F1", fontWeight: "600", textAlign: "center", marginTop: 4 },
  subtitle: { fontSize: 15, color: "#64748B", textAlign: "center", marginTop: 8, lineHeight: 22 },
  featuresWrap: { marginTop: 32, marginBottom: 32, gap: 12 },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  featureDesc: { fontSize: 13, color: "#64748B", marginTop: 2 },
  ctaBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaText: { color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 10 },
  footer: { fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 24, lineHeight: 16 },
});
