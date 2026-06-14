import { Redirect } from "expo-router";
import { Loading, Screen } from "@/src/components";
import { useAuth } from "@/src/auth";

export default function Index() {
  const { token, loading } = useAuth();
  if (loading) return <Screen scroll={false}><Loading /></Screen>;
  return <Redirect href={token ? "/(tabs)" : "/login"} />;
}
