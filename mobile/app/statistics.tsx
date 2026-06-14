import { StyleSheet, Text, View } from "react-native";
import { Card, ErrorState, Eyebrow, Loading, Metric, Screen, Title, common } from "@/src/components";
import { colors, radius } from "@/src/theme";
import { useApi } from "@/src/use-api";

type StatisticsData = {
  target: number;
  forecast: { expected: number; minimum: number; optimistic: number };
  attempts: Array<{ id: string; title: string; score: number; date: string | null }>;
  completedTasks: number;
  totalTasks: number;
  studyMinutes: number;
  closedTopics: number;
  fixedErrors: number;
  streaks: Array<{ day: string; minutes: number; points: number }>;
};

export default function StatisticsScreen() {
  const { data, error, loading, reload } = useApi<StatisticsData>("/api/mobile/statistics");
  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} retry={() => void reload()} /></Screen>;
  if (!data) return null;
  const maxScore = Math.max(data.target, ...data.attempts.map((attempt) => attempt.score), 1);
  return (
    <Screen refreshing={loading} onRefresh={() => void reload()}>
      <Eyebrow>Прогресс</Eyebrow>
      <View style={styles.header}><Title>Смотри, как растёт прогноз.</Title></View>
      <Card dark>
        <Text style={styles.forecast}>{data.forecast.expected}</Text>
        <Text style={styles.forecastLabel}>ожидаемый балл · диапазон {data.forecast.minimum}–{data.forecast.optimistic}</Text>
        <View style={styles.metrics}>
          <Metric dark value={`${data.completedTasks}/${data.totalTasks}`} label="задач выполнено" />
          <Metric dark value={data.studyMinutes} label="минут занятий" />
          <Metric dark value={data.fixedErrors} label="ошибок закрыто" />
        </View>
      </Card>
      <View style={common.section}>
        <Text style={common.sectionTitle}>История пробников</Text>
        <Card>
          {data.attempts.length ? (
            <View style={styles.chart}>
              {data.attempts.map((attempt) => (
                <View key={attempt.id} style={styles.column}>
                  <Text style={styles.value}>{attempt.score}</Text>
                  <View style={styles.barTrack}><View style={[styles.bar, { height: `${Math.max(8, attempt.score / maxScore * 100)}%` }]} /></View>
                  <Text style={styles.date}>{attempt.date ? new Date(attempt.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : ""}</Text>
                </View>
              ))}
            </View>
          ) : <Text style={common.body}>После первого пробника здесь появится график роста.</Text>}
        </Card>
      </View>
      <View style={common.section}>
        <Text style={common.sectionTitle}>Последние дни</Text>
        <View style={styles.days}>
          {Array.from({ length: 7 }).map((_, index) => {
            const row = data.streaks[index];
            return <View key={index} style={styles.day}><View style={[styles.dot, row?.minutes ? styles.dotActive : null]} /><Text style={styles.dayText}>{row ? new Date(row.day).toLocaleDateString("ru-RU", { weekday: "short" }).slice(0, 2) : "·"}</Text></View>;
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 12, marginBottom: 28 },
  forecast: { color: colors.white, fontSize: 72, lineHeight: 76, fontWeight: "800", letterSpacing: -4 },
  forecastLabel: { color: "rgba(255,255,255,.6)", fontSize: 13, lineHeight: 19, marginTop: -8 },
  metrics: { flexDirection: "row", gap: 10 },
  chart: { minHeight: 220, flexDirection: "row", alignItems: "flex-end", gap: 9 },
  column: { flex: 1, alignItems: "center", gap: 7 },
  value: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  barTrack: { width: "100%", height: 150, backgroundColor: colors.paper, borderRadius: radius.small, justifyContent: "flex-end", overflow: "hidden" },
  bar: { width: "100%", backgroundColor: colors.ink, borderRadius: radius.small },
  date: { color: colors.muted, fontSize: 9 },
  days: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.white, borderRadius: radius.large, borderWidth: 1, borderColor: colors.line, padding: 18 },
  day: { alignItems: "center", gap: 7 },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.paper },
  dotActive: { backgroundColor: colors.accent },
  dayText: { color: colors.muted, fontSize: 10, textTransform: "uppercase" },
});
