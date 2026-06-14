import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { apiRequest } from "@/src/api";
import { useAuth } from "@/src/auth";
import { Brand, Card, Eyebrow, Screen, Title, common } from "@/src/components";
import { colors, radius } from "@/src/theme";

type Message = { id: string; role: "user" | "assistant"; content: string };

const prompts = ["Почему здесь ответ B?", "Объясни проще", "Дай похожую задачу", "Составь тест по теме"];

export default function AiScreen() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: "intro", role: "assistant", content: "Я твой AI-репетитор. Спроси про тему, задачу или попроси объяснить правило проще." },
  ]);
  const [text, setText] = useState("");
  const [threadId, setThreadId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function send(value = text) {
    const message = value.trim();
    if (!message || busy || !token) return;
    const userMessage = { id: `${Date.now()}-user`, role: "user" as const, content: message };
    setMessages((current) => [...current, userMessage]);
    setText("");
    setBusy(true);
    try {
      const result = await apiRequest<{ answer: string; threadId: string }>("/api/mobile/ai", {
        method: "POST",
        body: JSON.stringify({ message, threadId, pageTitle: "AI-репетитор" }),
      }, token);
      setThreadId(result.threadId);
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: "assistant", content: result.answer }]);
    } catch (error) {
      setMessages((current) => [...current, { id: `${Date.now()}-error`, role: "assistant", content: error instanceof Error ? error.message : "Не удалось получить ответ." }]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={82}>
        <View style={styles.header}><View><Eyebrow>Qwen · Alibaba Model Studio</Eyebrow><Text style={styles.title}>AI-репетитор</Text></View><Brand /></View>
        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}><Title>Спроси так, как удобно тебе.</Title></View>
          <View style={styles.prompts}>
            {prompts.map((prompt) => <Pressable key={prompt} onPress={() => void send(prompt)} style={styles.prompt}><Text style={styles.promptText}>{prompt}</Text></Pressable>)}
          </View>
          {messages.map((message) => (
            <View key={message.id} style={[styles.message, message.role === "user" ? styles.user : styles.assistant]}>
              {message.role === "assistant" ? <Ionicons name="sparkles" size={16} color={colors.ink} /> : null}
              <Text style={[styles.messageText, message.role === "user" && styles.userText]}>{message.content}</Text>
            </View>
          ))}
          {busy ? <Card><Text style={common.muted}>AI формулирует объяснение...</Text></Card> : null}
        </ScrollView>
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            style={styles.input}
            multiline
            maxLength={2000}
            placeholder="Спроси про задачу или тему"
            placeholderTextColor={colors.muted}
          />
          <Pressable disabled={busy || !text.trim()} onPress={() => void send()} style={styles.send}>
            <Ionicons name="arrow-up" size={21} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, marginHorizontal: -20 },
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.ink, fontSize: 22, fontWeight: "800", marginTop: 3 },
  messages: { flex: 1 },
  messagesContent: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  hero: { marginVertical: 20 },
  prompts: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  prompt: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 13, paddingVertical: 10 },
  promptText: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  message: { maxWidth: "88%", borderRadius: 20, padding: 15, gap: 8 },
  user: { alignSelf: "flex-end", backgroundColor: colors.ink, borderBottomRightRadius: 6 },
  assistant: { alignSelf: "flex-start", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 6 },
  messageText: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  userText: { color: colors.white },
  composer: { borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, flexDirection: "row", alignItems: "flex-end", gap: 10 },
  input: { flex: 1, minHeight: 48, maxHeight: 110, borderRadius: 22, backgroundColor: colors.paper, paddingHorizontal: 16, paddingVertical: 13, color: colors.ink, fontSize: 15 },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
});
