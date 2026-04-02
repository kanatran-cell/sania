import { View, Text, Pressable, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useEffect } from "react";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const bg = isDark ? "bg-slate-900" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-text-primary";
  const textSecondary = isDark ? "text-slate-400" : "text-text-secondary";
  const stepBg = isDark ? "bg-indigo-500/20" : "bg-primary/10";

  return (
    <SafeAreaView className={`flex-1 ${bg}`}>
      <View className="flex-1 justify-center items-center px-8">
        {/* Logo */}
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          className="items-center mb-12"
        >
          <Animated.View
            style={pulseStyle}
            className="w-28 h-28 bg-primary rounded-3xl items-center justify-center mb-6 shadow-lg"
          >
            <Ionicons name="leaf" size={52} color="white" />
          </Animated.View>
          <Text className={`text-4xl font-bold ${textPrimary} mb-2`}>
            SanIA
          </Text>
          <Text className={`text-lg ${textSecondary} text-center`}>
            Compara productos y elige{"\n"}la opcion mas saludable
          </Text>
        </Animated.View>

        {/* Steps */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200).springify()}
          className="w-full mb-12"
        >
          <StepItem
            number="1"
            icon="camera-outline"
            text="Escanea productos con tu camara"
            isDark={isDark}
            stepBg={stepBg}
            textPrimary={textPrimary}
            delay={300}
          />
          <StepItem
            number="2"
            icon="images-outline"
            text="Agrega todos los que quieras comparar"
            isDark={isDark}
            stepBg={stepBg}
            textPrimary={textPrimary}
            delay={400}
          />
          <StepItem
            number="3"
            icon="trophy-outline"
            text="Descubre cual es el mas sano"
            isDark={isDark}
            stepBg={stepBg}
            textPrimary={textPrimary}
            delay={500}
          />
        </Animated.View>

        {/* CTA */}
        <AnimatedPressable
          entering={FadeInUp.duration(600).delay(600).springify()}
          className="w-full bg-primary py-4 rounded-2xl items-center active:opacity-80 shadow-lg"
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
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

function StepItem({
  number,
  icon,
  text,
  isDark,
  stepBg,
  textPrimary,
  delay,
}: {
  number: string;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  isDark: boolean;
  stepBg: string;
  textPrimary: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay).springify()}
      className="flex-row items-center mb-5"
    >
      <View
        className={`w-11 h-11 ${stepBg} rounded-full items-center justify-center mr-4`}
      >
        <Text className="text-primary font-bold text-base">{number}</Text>
      </View>
      <Ionicons
        name={icon}
        size={22}
        color={isDark ? "#818CF8" : "#6366F1"}
      />
      <Text className={`${textPrimary} ml-3 text-base flex-1`}>{text}</Text>
    </Animated.View>
  );
}
