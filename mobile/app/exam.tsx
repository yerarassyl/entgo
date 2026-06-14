import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { apiRequest } from "@/src/api";
import { useAuth } from "@/src/auth";
import { Button, ErrorState, Loading, Screen, common } from "@/src/components";
import { colors, radius } from "@/src/theme";

type ExamData = {
  attempt: { id: string; startedAt: string; expiresAt: string | null; durationSec: number };
  questions: Array<{ id: string; subject: string; topic: string; body: string; options: Array<{ id: string; content: string }> }>;
  savedAnswers: Array<{ questionId: string; optionId: string | null; usedAiHelp: boolean }>;
};

export default function ExamScreen() {
  const { topicId } = useLocalSearchParams<{ topicId?: string }>();
  const { token } = useAuth();
  const [data, setData] = useState<ExamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [helped, setHelped] = useState<Record<string, boolean>>({});
  const [hint, setHint] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    void apiRequest<ExamData>("/api/mobile/attempts/start", {
      method: "POST",
      body: JSON.stringify({ topicId }),
    }, token).then((result) => {
      setData(result);
      setAnswers(Object.fromEntries(result.savedAnswers.filter((row) => row.optionId).map((row) => [row.questionId, row.optionId!])));
      setHelped(Object.fromEntries(result.savedAnswers.map((row) => [row.questionId, row.usedAiHelp])));
      const seconds = result.attempt.expiresAt
        ? Math.max(0, Math.round((new Date(result.attempt.expiresAt).getTime() - Date.now()) / 1000))
        : result.attempt.durationSec;
      setRemaining(seconds);
    }).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Не удалось начать пробник."));
  }, [token, topicId]);

  useEffect(() => {
    if (!data || remaining <= 0) return;
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [data, remaining]);

  const question = data?.questions[index];
  const elapsed = useMemo(() => data ? Math.max(0, data.attempt.durationSec - remaining) : 0, [data, remaining]);

  async function choose(optionId: string) {
    if (!data || !question || !token) return;
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
    try {
      await apiRequest(`/api/mobile/attempts/${data.attempt.id}/answer`, {
        method: "POST",
        body: JSON.stringify({
          questionId: question.id,
          optionId,
          timeSpentSec: elapsed,
          usedAiHelp: Boolean(helped[question.id]),
        }),
      }, token);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Ответ не сохранён.");
    }
  }

  async function askHint() {
    if (!question || !token) return;
    setBusy(true);
    setHint(null);
    try {
      const result = await apiRequest<{ answer: string }>("/api/mobile/ai", {
        method: "POST",
        body: JSON.stringify({
          mode: "exam_hint",
          message: "Дай наводящую подсказку к этому вопросу",
          selectedText: question.body,
          pageTitle: `${question.subject}: ${question.topic}`,
        }),
      }, token);
      setHint(result.answer);
      setHelped((current) => ({ ...current, [question.id]: true }));
    } catch (requestError) {
      setHint(requestError instanceof Error ? requestError.message : "Подсказка недоступна.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!data || !token) return;
    setBusy(true);
    try {
      const result = await apiRequest<{ attemptId: string }>("/api/mobile/attempts/complete", {
        method: "POST",
        body: JSON.stringify({ attemptId: data.attempt.id, timeSpentSec: elapsed }),
      }, token);
      router.replace({ pathname: "/results/[id]", params: { id: result.attemptId } });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось завершить пробник.");
      setBusy(false);
    }
  }

  function confirmFinish() {
    const unanswered = data ? data.questions.length - Object.keys(answers).length : 0;
    Alert.alert(
      "Завершить пробник?",
      unanswered ? `Без ответа останется: ${unanswered}. Ответы нельзя будет изменить.` : "После завершения откроется разбор.",
      [{ text: "Продолжить решать", style: "cancel" }, { text: "Завершить", style: "destructive", onPress: () => void finish() }],
    );
  }

  if (error && !data) return <Screen><ErrorState message={error} /></Screen>;
  if (!data || !question) return <Screen scroll={false}><Loading /></Screen>;
  return (
    <Screen>
      <View style={common.between}>
        <Text style={styles.progress}>{index + 1} / {data.questions.length}</Text>
        <View style={[styles.clock, remaining < 300 && styles.clockDanger]}><Ionicons name="time-outline" size={16} color={remaining < 300 ? colors.danger : colors.ink} /><Text style={[styles.clockText, remaining < 300 && styles.danger]}>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</Text></View>
      </View>
      <View style={styles.bar}><View style={[styles.fill, { width: `${((index + 1) / data.questions.length) * 100}%` }]} /></View>
      <View style={styles.meta}><Text style={styles.subject}>{question.subject}</Text><Text style={common.muted}>{question.topic}</Text></View>
      <Text style={styles.question}>{question.body}</Text>
      <View style={styles.options}>
        {question.options.map((option, optionIndex) => {
          const selected = answers[question.id] === option.id;
          return (
            <Pressable key={option.id} onPress={() => void choose(option.id)} style={[styles.option, selected && styles.optionSelected]}>
              <Text style={[styles.letter, selected && styles.selectedText]}>{String.fromCharCode(65 + optionIndex)}</Text>
              <Text style={[styles.optionText, selected && styles.selectedText]}>{option.content}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={() => void askHint()} disabled={busy} style={styles.ai}>
        <Ionicons name="sparkles-outline" size={19} color={colors.ink} />
        <View style={{ flex: 1 }}><Text style={styles.aiTitle}>{busy ? "AI думает..." : "Попросить намёк у AI"}</Text><Text style={common.muted}>Без готового ответа · меньше XP</Text></View>
      </Pressable>
      {hint ? <View style={styles.hint}><Text style={styles.hintLabel}>AI-подсказка</Text><Text style={styles.hintText}>{hint}</Text></View> : null}
      {error ? <ErrorState message={error} /> : null}
      <View style={styles.navigation}>
        <Button title="Назад" onPress={() => { setHint(null); setIndex((value) => Math.max(0, value - 1)); }} secondary disabled={index === 0} />
        {index < data.questions.length - 1
          ? <Button title="Дальше" onPress={() => { setHint(null); setIndex((value) => value + 1); }} icon="arrow-forward" />
          : <Button title={busy ? "Завершаем..." : "Завершить"} onPress={confirmFinish} disabled={busy} icon="checkmark" />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  clock: { borderRadius: radius.pill, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  clockDanger: { backgroundColor: "#FBECEC" },
  clockText: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  danger: { color: colors.danger },
  bar: { height: 4, backgroundColor: colors.line, borderRadius: 2, marginTop: 16, overflow: "hidden" },
  fill: { height: 4, backgroundColor: colors.ink, borderRadius: 2 },
  meta: { marginTop: 32, gap: 4 },
  subject: { color: colors.ink, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  question: { color: colors.ink, fontSize: 22, lineHeight: 32, fontWeight: "700", marginVertical: 24 },
  options: { gap: 10 },
  option: { minHeight: 62, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  optionSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  letter: { color: colors.ink, fontSize: 12, fontWeight: "800", width: 28 },
  optionText: { color: colors.ink, fontSize: 15, lineHeight: 21, flex: 1 },
  selectedText: { color: colors.white },
  ai: { minHeight: 70, marginTop: 18, borderRadius: radius.medium, backgroundColor: colors.accent, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  aiTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  hint: { marginTop: 12, padding: 16, borderRadius: radius.medium, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, gap: 8 },
  hintLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  hintText: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  navigation: { marginTop: 24, flexDirection: "row", gap: 10 },
});
