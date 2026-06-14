import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { apiRequest } from "@/src/api";
import { useAuth } from "@/src/auth";
import { Button, Card, ErrorState, Eyebrow, Loading, Screen, Title, common } from "@/src/components";
import { colors, radius } from "@/src/theme";
import { useApi } from "@/src/use-api";

type StudyData = {
  task: { id: string; title: string; label: string; activity: string; durationMin: number; completed: boolean };
  lesson: { summary: string; rule: string; example: string; mistake: string } | null;
  questions: Array<{ id: string; body: string; explanation: string; options: Array<{ id: string; text: string }> }>;
};

export default function StudyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { data, error, loading, reload } = useApi<StudyData>(`/api/mobile/study/${id}`);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ accuracy: number; xp: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  async function complete() {
    if (!token || !data) return;
    setBusy(true);
    setSubmitError(null);
    try {
      const response = await apiRequest<{ accuracy: number; xp: number }>(`/api/mobile/study/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ answers, durationSec: elapsed }),
      }, token);
      setResult(response);
    } catch (requestError) {
      setSubmitError(requestError instanceof Error ? requestError.message : "Не удалось завершить занятие.");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} retry={() => void reload()} /></Screen>;
  if (!data) return null;
  if (result) {
    return (
      <Screen>
        <View style={styles.success}>
          <View style={styles.successIcon}><Ionicons name="checkmark" size={34} color={colors.white} /></View>
          <Eyebrow>Занятие завершено</Eyebrow>
          <Title>{result.accuracy}% правильных ответов.</Title>
          <Text style={common.body}>Начислено {result.xp} XP. Персональный план и карта слабых мест обновлены.</Text>
          <Button title="Вернуться к плану" onPress={() => router.replace("/(tabs)/plan")} icon="arrow-forward" />
        </View>
      </Screen>
    );
  }
  return (
    <Screen>
      <View style={common.between}>
        <Eyebrow>{data.task.label}</Eyebrow>
        <Text style={styles.timer}>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</Text>
      </View>
      <View style={styles.header}><Title>{data.task.title}</Title><Text style={common.body}>{data.task.durationMin} минут · теория и проверка понимания</Text></View>
      {data.lesson ? (
        <View style={styles.lesson}>
          <Card><Text style={styles.blockLabel}>Просто о главном</Text><Text style={styles.lessonText}>{data.lesson.summary}</Text></Card>
          <Card dark><Text style={styles.darkLabel}>Правило</Text><Text style={styles.darkText}>{data.lesson.rule}</Text></Card>
          <Card><Text style={styles.blockLabel}>Пример</Text><Text style={styles.lessonText}>{data.lesson.example}</Text></Card>
          <Card><Text style={styles.blockLabel}>Частая ошибка</Text><Text style={styles.lessonText}>{data.lesson.mistake}</Text></Card>
        </View>
      ) : null}
      {data.questions.length ? (
        <View style={common.section}>
          <Text style={common.sectionTitle}>Проверь себя</Text>
          {data.questions.map((question, questionIndex) => (
            <Card key={question.id}>
              <Text style={styles.number}>Вопрос {questionIndex + 1} из {data.questions.length}</Text>
              <Text style={styles.question}>{question.body}</Text>
              <View style={styles.options}>
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question.id] === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                      style={[styles.option, selected && styles.optionSelected]}
                    >
                      <Text style={[styles.optionLetter, selected && styles.optionSelectedText]}>{String.fromCharCode(65 + optionIndex)}</Text>
                      <Text style={[styles.optionText, selected && styles.optionSelectedText]}>{option.text}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          ))}
        </View>
      ) : null}
      {submitError ? <ErrorState message={submitError} /> : null}
      <Button
        title={busy ? "Проверяем..." : data.task.completed ? "Пройти ещё раз" : "Завершить занятие"}
        onPress={() => void complete()}
        disabled={busy || (data.questions.length > 0 && Object.keys(answers).length < data.questions.length)}
        icon="checkmark"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  timer: { color: colors.ink, backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, fontSize: 13, fontWeight: "800" },
  header: { gap: 14, marginTop: 16, marginBottom: 28 },
  lesson: { gap: 12 },
  blockLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2 },
  lessonText: { color: colors.ink, fontSize: 16, lineHeight: 25 },
  darkLabel: { color: colors.accent, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2 },
  darkText: { color: colors.white, fontSize: 18, lineHeight: 27, fontWeight: "600" },
  number: { color: colors.muted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  question: { color: colors.ink, fontSize: 18, lineHeight: 27, fontWeight: "700" },
  options: { gap: 9 },
  option: { minHeight: 54, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 },
  optionSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  optionLetter: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.paper, textAlign: "center", lineHeight: 30, color: colors.ink, fontSize: 12, fontWeight: "800" },
  optionText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20 },
  optionSelectedText: { color: colors.white },
  success: { minHeight: 620, justifyContent: "center", gap: 18 },
  successIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: colors.success },
});
