import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card, ErrorState, Eyebrow, Loading, Screen, Title, common } from "@/src/components";
import { colors } from "@/src/theme";
import { useApi } from "@/src/use-api";

type TestsData = {
  canTakeFullTest: boolean;
  canUseTopics: boolean;
  plan: string;
  tests: Array<{ id: string; title: string; type: string; durationSec: number; questions: number }>;
};

export default function TestsScreen() {
  const { data, error, loading, reload } = useApi<TestsData>("/api/mobile/tests");
  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} retry={() => void reload()} /></Screen>;
  if (!data) return null;
  return (
    <Screen refreshing={loading} onRefresh={() => void reload()}>
      <Eyebrow>Проверка уровня</Eyebrow>
      <View style={styles.header}><Title>Ответы только после завершения.</Title><Text style={common.body}>Решай в режиме реального ЕНТ. AI может дать намёк, но уменьшит XP.</Text></View>
      {data.tests.map((test, index) => (
        <Card key={test.id} dark={index === 0}>
          <Ionicons name={test.type === "DIAGNOSTIC" ? "speedometer-outline" : "document-text-outline"} size={28} color={index === 0 ? colors.white : colors.ink} />
          <Text style={[styles.testTitle, index === 0 && common.white]}>{test.title}</Text>
          <Text style={[common.muted, index === 0 && styles.whiteMuted]}>{test.questions} вопросов · {Math.round(test.durationSec / 60)} мин</Text>
          <Button
            title={data.canTakeFullTest ? "Начать пробник" : "Открыть Premium"}
            onPress={() => data.canTakeFullTest ? router.push("/exam") : router.push("/(tabs)/profile")}
            secondary={index === 0}
            icon="arrow-forward"
          />
        </Card>
      ))}
      <Card>
        <View style={common.between}><Ionicons name="library-outline" size={28} color={colors.ink} /><Text style={styles.badge}>Темы</Text></View>
        <Text style={styles.testTitle}>Короткие тесты по слабым темам</Text>
        <Text style={common.body}>Закрепляй конкретную тему и сразу обновляй персональный план.</Text>
        <Button title="Выбрать тему" onPress={() => router.push("/topics")} secondary icon="arrow-forward" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 14, marginTop: 12, marginBottom: 28 },
  testTitle: { color: colors.ink, fontSize: 22, lineHeight: 27, fontWeight: "800" },
  whiteMuted: { color: "rgba(255,255,255,.6)" },
  badge: { color: colors.ink, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
});
