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
        <View style={s.logoWrap}>
          <View style={s.logoBox}>
            <Ionicons name="leaf" size={52} color="white" />
          </View>
          <Text style={s.title}>SanIA</Text>
          <Text style={s.subtitle}>
            Compara productos y elige{"\n"}la opcion mas saludable
          </Text>
        </View>

        {/* Steps */}
        <View style={s.stepsWrap}>
          <StepItem number="1" icon="camera-outline" text="Escanea productos con tu camara" />
          <StepItem number="2" icon="images-outline" text="Agrega todos los que quieras comparar" />
          <StepItem number="3" icon="trophy-outline" text="Descubre cual es el mas sano" />
        </View>

        {/* CTA */}
        <Pressable
          style={s.ctaBtn}
          onPress={() => router.push("/scan")}
          accessibilityRole="button"
          accessibilityLabel="Empezar a escanear productos"
        >
          <Ionicons name="scan" size={22} color="white" />
          <Text style={s.ctaText}>Empezar a Escanear</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function StepItem({ number, icon, text }: { number: string; icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={s.stepRow}>
      <View style={s.stepCircle}>
        <Text style={s.stepNum}>{number}</Text>
      </View>
      <Ionicons name={icon} size={22} color="#6366F1" />
      <Text style={s.stepText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  logoWrap: { alignItems: "center", marginBottom: 48 },
  logoBox: { width: 112, height: 112, backgroundColor: "#6366F1", borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 36, fontWeight: "bold", color: "#0F172A", marginBottom: 8 },
  subtitle: { fontSize: 18, color: "#64748B", textAlign: "center" },
  stepsWrap: { width: "100%", marginBottom: 48 },
  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  stepCircle: { width: 44, height: 44, backgroundColor: "#6366F120", borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 16 },
  stepNum: { color: "#6366F1", fontWeight: "bold", fontSize: 16 },
  stepText: { color: "#0F172A", fontSize: 16, flex: 1, marginLeft: 12 },
  ctaBtn: { width: "100%", backgroundColor: "#6366F1", paddingVertical: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontSize: 18, fontWeight: "600", marginLeft: 8 },
});
