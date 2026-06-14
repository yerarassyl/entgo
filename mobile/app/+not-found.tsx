import { router, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/src/components";
import { colors } from "@/src/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Страница не найдена" }} />
      <View style={styles.container}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Такой страницы нет.</Text>
        <Button title="На главную" onPress={() => router.replace("/(tabs)")} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: colors.paper },
  code: { color: colors.muted, fontSize: 13, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: "800" },
});
