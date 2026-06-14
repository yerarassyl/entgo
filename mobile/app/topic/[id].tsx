import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { apiRequest } from "@/src/api";
import { useAuth } from "@/src/auth";
import { Button, Card, ErrorState, Eyebrow, Loading, Screen, Title, common } from "@/src/components";
import { colors } from "@/src/theme";
import { useApi } from "@/src/use-api";

type TopicData = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  completed: boolean;
  lesson: { summary: string; rule: string; example: string; mistake: string } | null;
  questions: Array<{ id: string; body: string; options: Array<{ id: string; text: string }> }>;
};

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { data, error, loading, reload, setData } = useApi<TopicData>(`/api/mobile/topics/${id}`);
  const [busy, setBusy] = useState(false);
  async function markComplete() {
    if (!token || !data) return;
    setBusy(true);
    try {
      await apiRequest(`/api/mobile/topics/${id}`, { method: "PATCH", body: "{}" }, token);
      setData({ ...data, completed: true });
    } finally {
      setBusy(false);
    }
  }
  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} retry={() => void reload()} /></Screen>;
  if (!data) return null;
  return (
    <Screen>
      <Eyebrow>{data.subject}</Eyebrow>
      <View style={styles.header}><Title>{data.title}</Title>{data.description ? <Text style={common.body}>{data.description}</Text> : null}</View>
      {data.lesson ? (
        <View style={styles.lesson}>
          <Card><Text style={styles.label}>Просто о главном</Text><Text style={styles.text}>{data.lesson.summary}</Text></Card>
          <Card dark><Text style={styles.darkLabel}>Правило</Text><Text style={styles.darkText}>{data.lesson.rule}</Text></Card>
          <Card><Text style={styles.label}>Пример</Text><Text style={styles.text}>{data.lesson.example}</Text></Card>
          <Card><Text style={styles.label}>Не перепутай</Text><Text style={styles.text}>{data.lesson.mistake}</Text></Card>
        </View>
      ) : <Card><Text style={common.body}>Теория для этой темы готовится.</Text></Card>}
      <Button
        title={data.completed ? "Теория изучена" : busy ? "Сохраняем..." : "Отметить как изученное"}
        onPress={() => void markComplete()}
        disabled={busy || data.completed}
        icon="checkmark"
      />
      <Button title="Пройти тест по теме" onPress={() => router.push({ pathname: "/exam", params: { topicId: data.id } })} secondary icon="arrow-forward" />
      <Card>
        <View style={common.row}><Ionicons name="sparkles-outline" size={20} color={colors.ink} /><Text style={common.label}>Не понял фрагмент?</Text></View>
        <Text style={common.body}>Открой AI-репетитора и попроси объяснить правило проще или дать похожую задачу.</Text>
        <Button title="Спросить AI" onPress={() => router.push("/(tabs)/ai")} secondary />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 14, marginTop: 12, marginBottom: 28 },
  lesson: { gap: 12, marginBottom: 14 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2 },
  text: { color: colors.ink, fontSize: 16, lineHeight: 25 },
  darkLabel: { color: colors.accent, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2 },
  darkText: { color: colors.white, fontSize: 18, lineHeight: 27, fontWeight: "600" },
});
