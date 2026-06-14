import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/src/api";
import { useAuth } from "@/src/auth";
import { Brand, Button, Eyebrow, Title, common } from "@/src/components";
import { colors, radius } from "@/src/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("premium@entgo.local");
  const [password, setPassword] = useState("PremiumDemo2026!");
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Не удалось войти.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}><Brand /></View>
        <View style={styles.hero}>
          <Eyebrow>Мобильное приложение</Eyebrow>
          <Title>Готовься к гранту каждый день.</Title>
          <Text style={common.body}>План, уроки, пробники и AI-репетитор теперь в нативном приложении.</Text>
        </View>
        <View style={styles.form}>
          <Text style={common.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
          />
          <Text style={common.label}>Пароль</Text>
          <View style={styles.password}>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              secureTextEntry={secure}
              value={password}
              onChangeText={setPassword}
              style={styles.passwordInput}
              placeholder="Минимум 8 символов"
              placeholderTextColor={colors.muted}
            />
            <Pressable onPress={() => setSecure((value) => !value)} hitSlop={12}>
              <Text style={styles.show}>{secure ? "Показать" : "Скрыть"}</Text>
            </Pressable>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title={busy ? "Входим..." : "Войти"} onPress={() => void submit()} disabled={busy} icon="arrow-forward" />
          <Pressable onPress={() => router.push("/register" as never)} style={styles.register}>
            <Text style={styles.registerText}>Нет аккаунта? Зарегистрироваться</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  wrapper: { flex: 1, padding: 20 },
  header: { paddingTop: 4 },
  hero: { marginTop: 48, gap: 16 },
  form: { marginTop: 38, gap: 10 },
  input: { minHeight: 54, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, color: colors.ink, paddingHorizontal: 16, fontSize: 16, marginBottom: 5 },
  password: { minHeight: 54, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 8 },
  passwordInput: { flex: 1, color: colors.ink, fontSize: 16 },
  show: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  register: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  registerText: { color: colors.ink, fontSize: 14, fontWeight: "700" },
});
