import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings-client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [preferences, universities] = await Promise.all([
    prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    }),
    prisma.university.findMany({
      select: { id: true, name: true, shortName: true, grantScore: true },
      orderBy: { grantScore: "desc" },
    }),
  ]);

  return (
    <SettingsClient
      universities={universities}
      initial={{
        name: user.name ?? "",
        email: user.email ?? "",
        city: user.city ?? "",
        school: user.school ?? "",
        targetScore: user.targetScore ?? 120,
        dailyMinutes: user.dailyMinutes ?? 45,
        examDate: user.examDate?.toISOString().slice(0, 10) ?? "",
        locale: user.locale,
        desiredUniversityId: user.desiredUniversityId ?? "",
        profileSubjects: user.profileSubjects ?? [],
        emailReminders: preferences?.emailReminders ?? true,
        weeklySummary: preferences?.weeklySummary ?? true,
        studyReminderAt: preferences?.studyReminderAt ?? "18:00",
      }}
    />
  );
}

