import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings-client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId: user.id },
  });

  return (
    <SettingsClient
      initial={{
        name: user.name ?? "",
        email: user.email ?? "",
        city: user.city ?? "",
        school: user.school ?? "",
        targetScore: user.targetScore ?? 120,
        dailyMinutes: user.dailyMinutes ?? 45,
        examDate: user.examDate?.toISOString().slice(0, 10) ?? "",
        locale: user.locale,
        emailReminders: preferences?.emailReminders ?? true,
        weeklySummary: preferences?.weeklySummary ?? true,
        studyReminderAt: preferences?.studyReminderAt ?? "18:00",
      }}
    />
  );
}
