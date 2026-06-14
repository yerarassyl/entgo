import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "./theme";

export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} /> : undefined}
        >
          {content}
        </ScrollView>
      ) : content}
    </SafeAreaView>
  );
}

export function Brand() {
  return <Text style={styles.brand}>entgo.kz</Text>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Card({
  children,
  dark = false,
  style,
}: {
  children: ReactNode;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, dark && styles.cardDark, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonSecondaryText]}>{title}</Text>
      {icon ? <Ionicons name={icon} size={18} color={secondary ? colors.ink : colors.white} /> : null}
    </Pressable>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.ink} />
      <Text style={styles.muted}>Загружаем...</Text>
    </View>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <Card>
      <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
      <Text style={styles.error}>{message}</Text>
      {retry ? <Button title="Повторить" onPress={retry} secondary /> : null}
    </Card>
  );
}

export function Metric({ label, value, dark = false }: { label: string; value: string | number; dark?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, dark && styles.white]}>{value}</Text>
      <Text style={[styles.metricLabel, dark && styles.whiteMuted]}>{label}</Text>
    </View>
  );
}

export const common = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },
  section: { gap: 14, marginTop: 28 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  label: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  white: { color: colors.white },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { flexGrow: 1, paddingBottom: 120 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  brand: { color: colors.ink, fontSize: 16, fontWeight: "800", letterSpacing: -0.5 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase" },
  title: { color: colors.ink, fontSize: 38, fontWeight: "700", lineHeight: 40, letterSpacing: -1.5 },
  card: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radius.large, borderWidth: 1, padding: 20, gap: 14 },
  cardDark: { backgroundColor: colors.ink, borderColor: colors.ink },
  button: { minHeight: 52, borderRadius: radius.pill, backgroundColor: colors.ink, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buttonSecondary: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1 },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  buttonSecondaryText: { color: colors.ink },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  center: { flex: 1, minHeight: 320, alignItems: "center", justifyContent: "center", gap: 12 },
  muted: { color: colors.muted, fontSize: 14 },
  error: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  metric: { flex: 1, minWidth: 72, gap: 3 },
  metricValue: { color: colors.ink, fontSize: 25, fontWeight: "800" },
  metricLabel: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  white: { color: colors.white },
  whiteMuted: { color: "rgba(255,255,255,.58)" },
});
