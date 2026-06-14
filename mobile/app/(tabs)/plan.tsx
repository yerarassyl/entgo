import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, ErrorState, Eyebrow, Loading, Metric, Screen, Title, common } from "@/src/components";
import { colors, radius } from "@/src/theme";
import { useApi } from "@/src/use-api";

type PlanData = {
  targetScore: number;
  forecast: { current: number; expected: number; minimum: number; optimistic: number; chance: number };
  days: Array<{
    key: string;
    weekday: string;
    date: string;
    isToday: boolean;
    tasks: Array<{ id: string; label: string; activity: string; title: string; durationMin: number; completed: boolean }>;
  }>;
};

export default function PlanScreen() {
  const { data, error, loading, reload } = useApi<PlanData>("/api/mobile/plan");
  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} retry={() => void reload()} /></Screen>;
  if (!data) return null;
  return (
    <Screen refreshing={loading} onRefresh={() => void reload()}>
      <Eyebrow>Персональный маршрут</Eyebrow>
      <View style={styles.header}><Title>Твой план на неделю.</Title><Text style={common.body}>Порядок задач обновляется после каждого ответа.</Text></View>
      <Card dark>
        <View style={common.between}><Text style={styles.whiteTitle}>Прогноз {data.forecast.expected}</Text><Text style={styles.chance}>{data.forecast.chance}% до цели</Text></View>
        <View style={styles.metrics}>
          <Metric dark value={data.forecast.current} label="сейчас" />
          <Metric dark value={data.targetScore} label="цель" />
          <Metric dark value={Math.max(0, data.targetScore - data.forecast.expected)} label="не хватает" />
        </View>
      </Card>
      {data.days.map((day) => (
        <View key={day.key} style={common.section}>
          <View style={common.between}>
            <View><Text style={styles.day}>{day.weekday}</Text><Text style={common.muted}>{day.date}</Text></View>
            {day.isToday ? <Text style={styles.today}>Сегодня</Text> : null}
          </View>
          {day.tasks.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => router.push({ pathname: "/study/[id]", params: { id: task.id } })}
              style={({ pressed }) => [styles.task, pressed && { opacity: 0.7 }]}
            >
              <View style={[styles.check, task.completed && styles.checked]}>
                <Ionicons name={task.completed ? "checkmark" : "arrow-forward"} size={17} color={task.completed ? colors.white : colors.ink} />
              </View>
              <View style={styles.copy}><Text style={styles.title} numberOfLines={2}>{task.title}</Text><Text style={common.muted}>{task.label} · {task.durationMin} мин</Text></View>
            </Pressable>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 14, marginTop: 12, marginBottom: 28 },
  metrics: { flexDirection: "row", gap: 12 },
  whiteTitle: { color: colors.white, fontSize: 22, fontWeight: "800" },
  chance: { color: colors.accent, fontSize: 12, fontWeight: "800" },
  day: { color: colors.ink, fontSize: 19, fontWeight: "800", textTransform: "capitalize" },
  today: { color: colors.ink, backgroundColor: colors.accent, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill, fontSize: 11, fontWeight: "800" },
  task: { minHeight: 76, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  check: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.soft, alignItems: "center", justifyContent: "center" },
  checked: { backgroundColor: colors.success },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  title: { color: colors.ink, fontSize: 15, fontWeight: "700", lineHeight: 20 },
});
