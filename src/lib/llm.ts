import "server-only";

type QwenRequest = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
};

type QwenResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export function qwenConfigured() {
  return Boolean(process.env.DASHSCOPE_API_KEY);
}

export async function generateQwenText({
  system,
  user,
  maxTokens = 550,
  temperature = 0.35,
}: QwenRequest) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (
    process.env.QWEN_BASE_URL ??
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  ).replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.QWEN_MODEL ?? "qwen-plus",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature,
      enable_thinking: false,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const result = (await response.json().catch(() => ({}))) as QwenResponse;
  if (!response.ok) {
    console.error("Qwen request failed", response.status, result.error?.message);
    return null;
  }
  return result.choices?.[0]?.message?.content?.trim() || null;
}
