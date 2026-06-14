import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/src/auth";
import { Button, Card, ErrorState, Eyebrow, Loading, Metric, Screen, Title, common } from "@/src/components";
import { colors, radius } from "@/src/theme";
import { useApi } from "@/src/use-api";

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  targetScore: number;
  dailyMinutes: number;
  examDate: string | null;
  xp: number;
  university: { name: string; grantScore: number } | null;
  premium: boolean;
};

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { data, error, loading, reload } = useApi<Profile>("/api/mobile/me");
  if (loading && !data) return <Screen scroll={false}><Loading /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} retry={() => void reload()} /></Screen>;
  if (!data) return null;
  return (
    <Screen refreshing={loading} onRefresh={() => void reload()}>
      <Eyebrow>Аккаунт</Eyebrow>
      <View style={styles.header}><Title>{data.name ?? "Ученик"}</Title><Text style={common.body}>{data.email}</Text></View>
      <Card dark>
        <View style={common.between}><Text style={styles.plan}>{data.premium ? "Premium" : "Free"}</Text><Ionicons name={data.premium ? "diamond" : "person"} size={24} color={colors.accent} /></View>
        <View style={styles.metrics}><Metric dark value={data.xp} label="всего XP" /><Metric dark value={data.targetScore} label="цель ЕНТ" /><Metric dark value={data.dailyMinutes} label="минут в день" /></View>
      </Card>
      <View style={styles.menu}>
        <MenuItem icon="stats-chart-outline" title="Статистика" subtitle="Прогноз, рост и история" onPress={() => router.push("/statistics")} />
        <MenuItem icon="library-outline" title="Все темы" subtitle="Теория и практика" onPress={() => router.push("/topics")} />
        <MenuItem icon="school-outline" title="Желаемый университет" subtitle={data.university?.name ?? "Не выбран"} />
        <MenuItem icon="calendar-outline" title="Дата ЕНТ" subtitle={data.examDate ? new Date(data.examDate).toLocaleDateString("ru-RU") : "Не указана"} />
      </View>
      {!data.premium ? (
        <Card>
          <Eyebrow>Premium</Eyebrow>
          <Text style={styles.premiumTitle}>Разблокируй полный план и AI.</Text>
          <Text style={common.body}>Безлимитные пробники, теория, разбор ошибок и прогноз поступления.</Text>
          <Button title="Открыть Premium" onPress={() => undefined} icon="arrow-forward" />
        </Card>
      ) : null}
      <Button title="Выйти из аккаунта" onPress={() => void logout()} secondary icon="log-out-outline" />
    </Screen>
  );
}

function MenuItem({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.65 }]}>
      <View style={styles.icon}><Ionicons name={icon} size={20} color={colors.ink} /></View>
      <View style={styles.itemCopy}><Text style={styles.itemTitle}>{title}</Text><Text style={common.muted}>{subtitle}</Text></View>
      {onPress ? <Ionicons name="chevron-forward" size={20} color={colors.muted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8, marginTop: 12, marginBottom: 28 },
  plan: { color: colors.white, fontSize: 24, fontWeight: "800" },
  metrics: { flexDirection: "row", gap: 12 },
  menu: { marginVertical: 24, borderRadius: radius.large, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
  item: { minHeight: 76, backgroundColor: colors.white, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" },
  itemCopy: { flex: 1, minWidth: 0, gap: 3 },
  itemTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  premiumTitle: { color: colors.ink, fontSize: 22, lineHeight: 27, fontWeight: "800" },
});
