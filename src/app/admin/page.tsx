import { BookOpen, CheckCircle2, CircleDashed, FileCheck2, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminContentStudio } from "@/components/admin-content-studio";
import { AdminQuestionList } from "@/components/admin-question-list";
import { AdminSupportList } from "@/components/admin-support-list";
import { AdminSubmissionList } from "@/components/admin-submission-list";
import { AdminUserList } from "@/components/admin-user-list";
import { AdminRewardList } from "@/components/admin-reward-list";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { getSessionUser } from "@/lib/auth";
import { canEditContent, isStaffRole, isSuperAdmin } from "@/lib/authorization";
import { jsonText } from "@/lib/exam";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isStaffRole(user.role)) redirect("/dashboard");
  const superAdmin = isSuperAdmin(user.role);

  const [users, attempts, published, auditLogs, questions, subjects, tickets, submissions, userRows, rewardClaims] = await Promise.all([
    superAdmin ? prisma.user.count() : Promise.resolve(0),
    superAdmin ? prisma.testAttempt.count({ where: { status: "COMPLETED" } }) : Promise.resolve(0),
    superAdmin ? prisma.question.count({ where: { status: "PUBLISHED" } }) : Promise.resolve(0),
    superAdmin
      ? prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 12,
          include: { actor: { select: { name: true, email: true } } },
        })
      : Promise.resolve([]),
    canEditContent(user.role)
      ? prisma.question.findMany({
          orderBy: { updatedAt: "desc" },
          take: 50,
          include: { subject: true, topic: true },
        })
      : Promise.resolve([]),
    canEditContent(user.role)
      ? prisma.subject.findMany({
          orderBy: { titleRu: "asc" },
          include: {
            topics: {
              orderBy: { titleRu: "asc" },
              include: { lesson: true },
            },
          },
        })
      : Promise.resolve([]),
    superAdmin
      ? prisma.supportTicket.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { user: { select: { email: true, name: true } } },
        })
      : Promise.resolve([]),
    prisma.contentSubmission.findMany({
      where: superAdmin ? {} : { adminId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    superAdmin
      ? prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            subscriptions: {
              where: { status: "ACTIVE", currentEnd: { gt: new Date() } },
              select: { id: true },
              take: 1,
            },
          },
        })
      : Promise.resolve([]),
    superAdmin
      ? prisma.rewardClaim.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { user: { select: { name: true, email: true } } },
        })
      : Promise.resolve([]),
  ]);
  const integrations = [
    ["Qwen · Alibaba Model Studio", Boolean(process.env.DASHSCOPE_API_KEY), process.env.QWEN_MODEL ?? "qwen-plus"],
    ["Email · Resend", Boolean(process.env.RESEND_API_KEY), process.env.EMAIL_FROM ?? "EMAIL_FROM"],
    ["SMS", Boolean(process.env.SMS_SEND_URL && process.env.SMS_API_KEY), "SMS_SEND_URL"],
    ["Google OAuth", Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET), "Google Cloud"],
    ["Платежи", Boolean(process.env.PAYMENT_CHECKOUT_URL && process.env.PAYMENT_WEBHOOK_SECRET), process.env.PAYMENT_PROVIDER ?? "external"],
  ] as const;

  return (
    <main className="admin-page min-h-screen bg-paper pb-16">
      <header className="border-b border-line bg-white">
        <div className="container-shell flex h-18 items-center justify-between gap-4">
          <Brand />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-muted sm:inline">
              {superAdmin ? "Суперадмин" : "Контент-админ · ограниченный доступ"}
            </span>
            <LogoutButton header />
          </div>
        </div>
      </header>
      <div className="container-shell py-10 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Панель управления · {user.role}</p>
        <h1 className="display mt-4 text-5xl sm:text-7xl">{superAdmin ? <>Состояние <span className="italic">платформы.</span></> : <>Управление <span className="italic">контентом.</span></>}</h1>
        {!superAdmin && <p className="mt-5 max-w-2xl text-muted">Создавайте вопросы, уроки и темы. Все материалы отправляются суперадмину на проверку перед публикацией.</p>}
        {superAdmin && <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[[users, "пользователей", UsersRound], [attempts, "завершённых тестов", FileCheck2], [published, "вопросов опубликовано", BookOpen]].map(([value, label, Icon]) => {
            const IconComponent = Icon as typeof UsersRound;
            return <div key={label as string} className="rounded-[22px] border border-line bg-white p-6"><IconComponent size={20} /><p className="display mt-8 text-5xl">{value as number}</p><p className="mt-1 text-sm text-muted">{label as string}</p></div>;
          })}
        </div>}

        {superAdmin && <section className="mt-10">
          <h2 className="text-xl font-semibold">Готовность интеграций</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {integrations.map(([label, configured, detail]) => <div key={label} className="rounded-[20px] border border-line bg-white p-5"><div className="flex items-center gap-2 text-sm font-semibold">{configured ? <CheckCircle2 size={17} className="text-success" /> : <CircleDashed size={17} className="text-muted" />}{label}</div><p className="mt-5 text-xs text-muted">{configured ? `Подключено · ${detail}` : `Ожидает настройки · ${detail}`}</p></div>)}
          </div>
        </section>}

        {canEditContent(user.role) && <AdminContentStudio canPublish={superAdmin} subjects={subjects.map((subject) => ({ id: subject.id, label: subject.titleRu }))} topics={subjects.flatMap((subject) => subject.topics.map((topic) => ({ id: topic.id, subjectId: subject.id, label: `${subject.titleRu} · ${topic.titleRu}`, lesson: topic.lesson ? { summary: topic.lesson.summary, rule: topic.lesson.rule, example: topic.lesson.example, mistake: topic.lesson.mistake, steps: Array.isArray(topic.lesson.steps) ? topic.lesson.steps.filter((step): step is string => typeof step === "string") : [], published: Boolean(topic.lesson.publishedAt) } : null })))} />}

        {superAdmin && <details className="admin-module mt-10 rounded-[24px] border border-line bg-white p-5 sm:p-7"><summary className="cursor-pointer text-xl font-semibold">Модерация вопросов</summary><AdminQuestionList initialQuestions={questions.map((question) => ({ id: question.id, body: jsonText(question.body), subject: question.subject.titleRu, topic: question.topic.titleRu, status: question.status, difficulty: question.difficulty }))} /></details>}

        {superAdmin && <details className="admin-module mt-10 rounded-[24px] border border-line bg-white p-5 sm:p-7">
          <summary className="cursor-pointer text-xl font-semibold">Пользователи, роли и подписки</summary>
          <AdminUserList currentUserId={user.id} initialUsers={userRows.filter((row) => ["STUDENT", "ADMIN", "SUPERADMIN"].includes(row.role)).map((row) => ({ id: row.id, name: row.name ?? "Без имени", email: row.email ?? "Без email", role: row.role as "STUDENT" | "ADMIN" | "SUPERADMIN", premium: row.subscriptions.length > 0, createdAt: new Intl.DateTimeFormat("ru-RU").format(row.createdAt) }))} />
        </details>}

        {superAdmin && <details className="admin-module mt-10 rounded-[24px] border border-line bg-white p-5 sm:p-7">
          <summary className="cursor-pointer text-xl font-semibold">Заявки на подарок 130+</summary>
          <AdminRewardList initialClaims={rewardClaims.map((claim) => ({ id: claim.id, user: claim.user.email ?? claim.user.name ?? "Ученик", score: claim.officialScore, proofUrl: claim.proofUrl, status: claim.status }))} />
        </details>}

        {superAdmin && <details className="admin-module mt-10 rounded-[24px] border border-line bg-white p-5 sm:p-7">
          <summary className="cursor-pointer text-xl font-semibold">Служба поддержки</summary>
          <AdminSupportList initialTickets={tickets.map((ticket) => ({ id: ticket.id, message: ticket.message, pageUrl: ticket.pageUrl, screenshotUrl: ticket.screenshotUrl, status: ticket.status, response: ticket.response, user: ticket.user?.email ?? ticket.user?.name ?? "Гость", subscription: ticket.subscription ?? "free", createdAt: new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(ticket.createdAt) }))} />
        </details>}

        <section className="mt-10">
          <h2 className="text-xl font-semibold">{superAdmin ? "Предложения на модерации" : "Мои предложения"}</h2>
          <AdminSubmissionList canModerate={superAdmin} items={submissions.map((item) => ({ id: item.id, contentType: item.contentType, status: item.status, createdAt: new Intl.DateTimeFormat("ru-RU").format(item.createdAt) }))} />
        </section>

        {superAdmin && <details className="admin-module mt-10 rounded-[24px] border border-line bg-white p-5 sm:p-7">
          <summary className="cursor-pointer text-xl font-semibold">Последние события аудита</summary>
          <div className="mt-5 overflow-hidden rounded-[24px] border border-line bg-white divide-y divide-line">
            {auditLogs.map((log) => <div key={log.id} className="grid gap-1 px-5 py-4 text-sm sm:grid-cols-[180px_1fr_180px]"><span className="font-semibold">{log.action}</span><span className="text-muted">{log.actor?.email ?? log.actor?.name ?? "Система"}</span><span className="text-xs text-muted sm:text-right">{new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(log.createdAt)}</span></div>)}
          </div>
        </details>}
      </div>
    </main>
  );
}
