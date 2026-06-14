import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ErrorState, Eyebrow, Loading, Screen, Title, common } from "@/src/components";
import { colors, radius } from "@/src/theme";
import { useApi } from "@/src/use-api";

type TopicsData = {
  subjects: Array<{
    id: string;
    title: string;
    required: boolean;
    topics: Array<{ id: string; title: string; questions: number; hasLesson: boolean; progress: number }>;
  }>;
};

export default function TopicsScreen() {
  const { data, error, loading, reload } = useApi<TopicsData>("/api/mobile/topics");
  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} retry={() => void reload()} /></Screen>;
  if (!data) return null;
  return (
    <Screen>
      <Eyebrow>Библиотека знаний</Eyebrow>
      <View style={styles.header}><Title>Каждая тема простым языком.</Title><Text style={common.body}>Начинай с тем с самым низким процентом готовности.</Text></View>
      {data.subjects.map((subject) => (
        <View key={subject.id} style={common.section}>
          <View style={common.between}><Text style={common.sectionTitle}>{subject.title}</Text><Text style={common.muted}>{subject.topics.length} тем</Text></View>
          {subject.topics.map((topic) => (
            <Pressable
              key={topic.id}
              onPress={() => router.push({ pathname: "/topic/[id]", params: { id: topic.id } })}
              style={({ pressed }) => [styles.topic, pressed && { opacity: 0.68 }]}
            >
              <View style={styles.icon}><Ionicons name={topic.hasLesson ? "book-outline" : "document-text-outline"} size={20} color={colors.ink} /></View>
              <View style={styles.copy}><Text style={styles.title}>{topic.title}</Text><Text style={common.muted}>{topic.questions} заданий · {topic.progress}% готовности</Text><View style={styles.track}><View style={[styles.fill, { width: `${topic.progress}%` }]} /></View></View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 14, marginTop: 12, marginBottom: 10 },
  topic: { minHeight: 86, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  title: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.paper, marginTop: 3, overflow: "hidden" },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.ink },
});
