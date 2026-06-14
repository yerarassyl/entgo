import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "./api";
import { useAuth } from "./auth";

export function useApi<T>(path: string) {
  const { token, logout } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setData(await apiRequest<T>(path, {}, token));
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) await logout();
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить данные.");
    } finally {
      setLoading(false);
    }
  }, [logout, path, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}
