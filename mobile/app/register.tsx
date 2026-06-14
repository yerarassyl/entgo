import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError, apiRequest } from "@/src/api";
import { useAuth } from "@/src/auth";
import { Button, Card, Eyebrow, Screen, Title, common } from "@/src/components";
import { colors, radius } from "@/src/theme";

type University = { slug: string; shortName: string; name: string; grantScore: number };

export default function RegisterScreen() {
  const { register } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetScore, setTargetScore] = useState("120");
  const [examDate, setExamDate] = useState("");
  const [university, setUniversity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void apiRequest<{ universities: University[] }>("/api/mobile/universities")
      .then((result) => {
        setUniversities(result.universities);
        setUniversity(result.universities[0]?.slug ?? "");
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить университеты."));
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await register({
        name,
        email,
        password,
        targetScore: Number(targetScore),
        dailyMinutes: 45,
        desiredUniversitySlug: university,
        examDate: examDate.trim() || null,
      });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Не удалось создать аккаунт.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Eyebrow>Новый аккаунт</Eyebrow>
      <View style={styles.header}><Title>Узнай свой путь до гранта.</Title><Text style={common.body}>Дата ЕНТ необязательна. Её можно добавить позже.</Text></View>
      <View style={styles.form}>
        <Field label="Имя" value={name} onChangeText={setName} placeholder="Как к тебе обращаться" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
        <Field label="Пароль" value={password} onChangeText={setPassword} placeholder="10+ символов, буквы и цифры" secureTextEntry />
        <Field label="Целевой балл" value={targetScore} onChangeText={setTargetScore} placeholder="120" keyboardType="number-pad" />
        <Field label="Дата ЕНТ (можно пропустить)" value={examDate} onChangeText={setExamDate} placeholder="2026-06-25" />
      </View>
      <View style={common.section}>
        <Text style={common.sectionTitle}>Желаемый университет</Text>
        {universities.map((item) => {
          const selected = university === item.slug;
          return (
            <Pressable key={item.slug} onPress={() => setUniversity(item.slug)} style={[styles.university, selected && styles.selected]}>
              <View style={{ flex: 1 }}><Text style={[styles.uniName, selected && styles.selectedText]}>{item.shortName}</Text><Text style={[common.muted, selected && styles.selectedMuted]} numberOfLines={1}>{item.name}</Text></View>
              <Text style={[styles.grant, selected && styles.selectedText]}>{item.grantScore}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Card><Text style={styles.error}>{error}</Text></Card> : null}
      <Button title={busy ? "Создаём аккаунт..." : "Создать аккаунт"} onPress={() => void submit()} disabled={busy} icon="arrow-forward" />
      <Text style={styles.consent}>Нажимая кнопку, ты принимаешь условия использования и политику конфиденциальности.</Text>
    </Screen>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "number-pad";
  secureTextEntry?: boolean;
}) {
  return <View style={styles.field}><Text style={common.label}>{props.label}</Text><TextInput {...props} autoCapitalize="none" placeholderTextColor={colors.muted} style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  header: { gap: 14, marginTop: 12, marginBottom: 28 },
  form: { gap: 14 },
  field: { gap: 7 },
  input: { minHeight: 54, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, color: colors.ink, paddingHorizontal: 16, fontSize: 16 },
  university: { minHeight: 70, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  selected: { backgroundColor: colors.ink, borderColor: colors.ink },
  uniName: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  grant: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  selectedText: { color: colors.white },
  selectedMuted: { color: "rgba(255,255,255,.58)" },
  error: { color: colors.danger, fontSize: 14 },
  consent: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: "center" },
});
