import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-8">
        {/* Logo y branding */}
        <View className="items-center mb-12">
          <View className="w-24 h-24 bg-primary rounded-3xl items-center justify-center mb-6">
            <Ionicons name="leaf" size={48} color="white" />
          </View>
          <Text className="text-4xl font-bold text-text-primary mb-2">
            SanIA
          </Text>
          <Text className="text-lg text-text-secondary text-center">
            Compara productos y elige{"\n"}la opción más saludable
          </Text>
        </View>

        {/* Pasos */}
        <View className="w-full mb-12">
          <StepItem
            number="1"
            icon="camera-outline"
            text="Escanea productos con tu cámara"
          />
          <StepItem
            number="2"
            icon="images-outline"
            text="Agrega todos los que quieras comparar"
          />
          <StepItem
            number="3"
            icon="trophy-outline"
            text="Descubre cuál es el más sano"
          />
        </View>

        {/* CTA */}
        <Pressable
          className="w-full bg-primary py-4 rounded-xl items-center active:opacity-80"
          onPress={() => router.push("/scan")}
          accessibilityRole="button"
          accessibilityLabel="Empezar a escanear productos"
        >
          <View className="flex-row items-center">
            <Ionicons name="scan" size={22} color="white" />
            <Text className="text-white text-lg font-semibold ml-2">
              Empezar a Escanear
            </Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function StepItem({
  number,
  icon,
  text,
}: {
  number: string;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View className="flex-row items-center mb-4">
      <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-4">
        <Text className="text-primary font-bold">{number}</Text>
      </View>
      <Ionicons name={icon} size={20} color="#6366F1" />
      <Text className="text-text-primary ml-3 text-base flex-1">{text}</Text>
    </View>
  );
}
