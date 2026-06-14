import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AuthProvider } from "@/src/auth";
import { colors } from "@/src/theme";

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerBackTitle: "Назад",
          contentStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: "Регистрация" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="exam" options={{ title: "Пробный ЕНТ", presentation: "fullScreenModal" }} />
        <Stack.Screen name="results/[id]" options={{ title: "Результат" }} />
        <Stack.Screen name="study/[id]" options={{ title: "Занятие" }} />
        <Stack.Screen name="topics" options={{ title: "Все темы" }} />
        <Stack.Screen name="topic/[id]" options={{ title: "Тема" }} />
        <Stack.Screen name="statistics" options={{ title: "Статистика" }} />
      </Stack>
    </AuthProvider>
  );
}
