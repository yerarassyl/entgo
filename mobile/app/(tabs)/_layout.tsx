import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@/src/auth";
import { Loading, Screen } from "@/src/components";
import { colors } from "@/src/theme";

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "home-outline",
  plan: "calendar-outline",
  tests: "document-text-outline",
  ai: "sparkles-outline",
  profile: "person-outline",
};

export default function TabLayout() {
  const { token, loading } = useAuth();
  if (loading) return <Screen scroll={false}><Loading /></Screen>;
  if (!token) return <Redirect href="/login" />;
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", paddingBottom: 2 },
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor: colors.line,
          backgroundColor: colors.white,
        },
        tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name] ?? "ellipse-outline"} color={color} size={size} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Главная" }} />
      <Tabs.Screen name="plan" options={{ title: "План" }} />
      <Tabs.Screen name="tests" options={{ title: "Пробники" }} />
      <Tabs.Screen name="ai" options={{ title: "AI" }} />
      <Tabs.Screen name="profile" options={{ title: "Профиль" }} />
    </Tabs>
  );
}
