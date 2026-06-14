import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, ErrorState, Eyebrow, Loading, Metric, Screen, Title, common } from "@/src/components";
import { colors, radius } from "@/src/theme";
import { useApi } from "@/src/use-api";

type HomeData = {
  user: { name: string; xp: number };
  forecast: { current: number; expected: number; minimum: number; optimistic: number; target: number; chance: number };
  university: { name: string; grantScore: number; chance: number } | null;
  tasks: Array<{ id: string; label: string; activity: string; title: string; durationMin: number; completed: boolean }>;
  weakTopics: Array<{ id: string; title: string; subject: string; mastery: number }>;
};

export default function HomeScreen() {
  const { data, error, loading, reload } = useApi<HomeData>("/api/mobile/home");
  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} retry={() => void reload()} /></Screen>;
  if (!data) return null;
  const missing = Math.max(0, data.forecast.target - data.forecast.expected);
  return (
    <Screen refreshing={loading} onRefresh={() => void reload()}>
      <View style={common.between}>
        <View><Eyebrow>Сегодня</Eyebrow><Text style={styles.hello}>Привет, {data.user.name}</Text></View>
        <View style={styles.xp}><Ionicons name="flash" size={14} color={colors.ink} /><Text style={styles.xpText}>{data.user.xp} XP</Text></View>
      </View>

      <View style={styles.hero}>
        <Title>До цели осталось {missing} баллов.</Title>
        <Text style={common.body}>ENTGO уже выбрал темы, которые быстрее всего поднимут прогноз.</Text>
      </View>

      <Card dark>
        <Eyebrow>Живой прогноз ЕНТ</Eyebrow>
        <View style={styles.forecastLine}>
          <Text style={styles.forecast}>{data.forecast.expected}</Text>
          <Text style={styles.range}>{data.forecast.minimum}–{data.forecast.optimistic}</Text>
        </View>
        <View style={styles.metrics}>
          <Metric dark value={data.forecast.current} label="текущий балл" />
          <Metric dark value={data.forecast.target} label="цель" />
          <Metric dark value={`${data.forecast.chance}%`} label="шанс цели" />
        </View>
      </Card>

      {data.university ? (
        <Card>
          <View style={common.between}><Text style={common.sectionTitle}>{data.university.name}</Text><Ionicons name="school-outline" size={22} color={colors.ink} /></View>
          <View style={styles.metrics}>
            <Metric value={data.university.grantScore} label="нужно на грант" />
            <Metric value={`${data.university.chance}%`} label="шанс поступления" />
          </View>
        </Card>
      ) : null}

      <View style={common.section}>
        <View style={common.between}><Text style={common.sectionTitle}>План на сегодня</Text><Text style={common.muted}>{data.tasks.filter((task) => task.completed).length}/{data.tasks.length}</Text></View>
        {data.tasks.length ? data.tasks.map((task) => (
          <Pressable
            key={task.id}
            onPress={() => router.push({ pathname: "/study/[id]", params: { id: task.id } })}
            style={({ pressed }) => [styles.task, pressed && styles.pressed]}
          >
            <View style={[styles.taskIcon, task.completed && styles.taskDone]}>
              <Ionicons name={task.completed ? "checkmark" : "play"} size={18} color={task.completed ? colors.white : colors.ink} />
            </View>
            <View style={styles.taskCopy}><Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text><Text style={common.muted}>{task.label} · {task.durationMin} мин</Text></View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        )) : <Card><Text style={common.body}>На сегодня всё выполнено. Отличная работа.</Text></Card>}
      </View>

      <View style={common.section}>
        <Text style={common.sectionTitle}>Быстрый рост</Text>
        {data.weakTopics.map((topic, index) => (
          <View key={topic.id} style={styles.topic}>
            <Text style={styles.topicIndex}>0{index + 1}</Text>
            <View style={styles.taskCopy}><Text style={styles.taskTitle}>{topic.title}</Text><Text style={common.muted}>{topic.subject}</Text></View>
            <Text style={styles.mastery}>{topic.mastery}%</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hello: { color: colors.ink, fontSize: 19, fontWeight: "700", marginTop: 4 },
  xp: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  xpText: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  hero: { gap: 14, marginVertical: 32 },
  forecastLine: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  forecast: { color: colors.white, fontSize: 72, fontWeight: "800", letterSpacing: -4, lineHeight: 78 },
  range: { color: "rgba(255,255,255,.58)", fontSize: 15, fontWeight: "700", marginBottom: 13 },
  metrics: { flexDirection: "row", gap: 12 },
  task: { minHeight: 78, borderRadius: radius.medium, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  taskIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: colors.soft },
  taskDone: { backgroundColor: colors.success },
  taskCopy: { flex: 1, minWidth: 0, gap: 4 },
  taskTitle: { color: colors.ink, fontSize: 15, fontWeight: "700", lineHeight: 20 },
  pressed: { opacity: 0.68 },
  topic: { minHeight: 68, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: "row", alignItems: "center", gap: 12 },
  topicIndex: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  mastery: { color: colors.ink, fontSize: 16, fontWeight: "800" },
});
