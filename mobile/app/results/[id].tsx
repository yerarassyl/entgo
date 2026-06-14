import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Card, ErrorState, Eyebrow, Loading, Metric, Screen, Title, common } from "@/src/components";
import { colors, radius } from "@/src/theme";
import { useApi } from "@/src/use-api";

type ResultData = {
  locked: boolean;
  score: number;
  correct: number;
  total: number;
  timeSpentSec: number;
  xpAwarded: number;
  aiHelpCount: number;
  forecast: { expected: number; minimum: number; optimistic: number; chanceTarget: number };
  university: { name: string; grantScore: number; chance: number } | null;
  subjects: Array<{ name: string; percent: number }>;
  answers: Array<{ id: string; isCorrect: boolean; usedAiHelp: boolean; topic: string; subject: string; question: string; selected: string; correct: string; explanation: string }>;
};

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, loading, reload } = useApi<ResultData>(`/api/mobile/results/${id}`);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} retry={() => void reload()} /></Screen>;
  if (!data) return null;
  return (
    <Screen>
      <Eyebrow>Пробник завершён</Eyebrow>
      <View style={styles.header}><Title>Теперь понятно, где лежат баллы.</Title></View>
      <Card dark>
        <Text style={styles.score}>{data.score}</Text>
        <Text style={styles.scoreLabel}>баллов из 140</Text>
        <View style={styles.metrics}>
          <Metric dark value={`${data.correct}/${data.total}`} label="верных ответов" />
          <Metric dark value={`+${data.xpAwarded}`} label="XP начислено" />
          <Metric dark value={data.aiHelpCount} label="AI-подсказок" />
        </View>
      </Card>
      <Card>
        <Eyebrow>Прогноз после пробника</Eyebrow>
        <View style={styles.forecast}><Text style={styles.forecastNumber}>{data.forecast.expected}</Text><Text style={common.muted}>диапазон {data.forecast.minimum}–{data.forecast.optimistic}</Text></View>
        <View style={styles.metrics}><Metric value={`${data.forecast.chanceTarget}%`} label="шанс набрать цель" />{data.university ? <Metric value={`${data.university.chance}%`} label={`шанс в ${data.university.name}`} /> : null}</View>
      </Card>
      <View style={common.section}>
        <Text style={common.sectionTitle}>По предметам</Text>
        {data.subjects.map((subject) => (
          <View key={subject.name} style={styles.subject}>
            <View style={common.between}><Text style={styles.subjectName}>{subject.name}</Text><Text style={styles.percent}>{subject.percent}%</Text></View>
            <View style={styles.track}><View style={[styles.subjectFill, { width: `${subject.percent}%` }]} /></View>
          </View>
        ))}
      </View>
      <View style={common.section}>
        <Text style={common.sectionTitle}>Разбор ответов</Text>
        {data.answers.map((answer, index) => {
          const expanded = open[answer.id];
          return (
            <Pressable key={answer.id} onPress={() => setOpen((current) => ({ ...current, [answer.id]: !expanded }))} style={styles.answer}>
              <View style={styles.answerTop}>
                <View style={[styles.status, answer.isCorrect ? styles.correct : styles.wrong]}><Ionicons name={answer.isCorrect ? "checkmark" : "close"} size={16} color={colors.white} /></View>
                <View style={styles.answerCopy}><Text style={styles.answerTitle}>Вопрос {index + 1} · {answer.topic}</Text><Text numberOfLines={expanded ? undefined : 2} style={common.muted}>{answer.question}</Text></View>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
              </View>
              {expanded ? (
                <View style={styles.details}>
                  <Text style={styles.detailLabel}>Твой ответ</Text><Text style={common.body}>{answer.selected}</Text>
                  {!answer.isCorrect ? <><Text style={styles.detailLabel}>Правильный ответ</Text><Text style={common.body}>{answer.correct}</Text></> : null}
                  <Text style={styles.detailLabel}>Объяснение</Text><Text style={common.body}>{answer.explanation}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <Button title="Открыть новый план" onPress={() => router.replace("/(tabs)/plan")} icon="arrow-forward" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 12, marginBottom: 28 },
  score: { color: colors.white, fontSize: 78, lineHeight: 82, fontWeight: "800", letterSpacing: -4 },
  scoreLabel: { color: "rgba(255,255,255,.6)", fontSize: 14, marginTop: -12 },
  metrics: { flexDirection: "row", gap: 12 },
  forecast: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  forecastNumber: { color: colors.ink, fontSize: 54, fontWeight: "800", letterSpacing: -2 },
  subject: { backgroundColor: colors.white, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
  subjectName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  percent: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  track: { height: 7, borderRadius: 4, backgroundColor: colors.paper, overflow: "hidden" },
  subjectFill: { height: 7, borderRadius: 4, backgroundColor: colors.ink },
  answer: { backgroundColor: colors.white, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.line, padding: 15, gap: 14 },
  answerTop: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  status: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  correct: { backgroundColor: colors.success },
  wrong: { backgroundColor: colors.danger },
  answerCopy: { flex: 1, minWidth: 0, gap: 4 },
  answerTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  details: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14, gap: 8 },
  detailLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.1, marginTop: 6 },
});
