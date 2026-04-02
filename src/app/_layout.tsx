import "../../global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: {
              backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="scan" />
          <Stack.Screen
            name="results"
            options={{ animation: "slide_from_bottom" }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
