import Constants from "expo-constants";

function resolveApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ? `http://${host}:3000` : "http://localhost:3000";
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  status: number;
  upgrade: boolean;

  constructor(message: string, status: number, upgrade = false) {
    super(message);
    this.status = status;
    this.upgrade = upgrade;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({})) as { error?: string; upgrade?: boolean };
  if (!response.ok) {
    throw new ApiError(body.error ?? "Не удалось выполнить запрос.", response.status, Boolean(body.upgrade));
  }
  return body as T;
}
