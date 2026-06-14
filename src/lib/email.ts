import "server-only";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`Password reset for ${email}: ${resetUrl}`);
    }
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Восстановление доступа к entgo.kz",
      html: `<p>Вы запросили новый пароль для entgo.kz.</p><p><a href="${resetUrl}">Создать новый пароль</a></p><p>Ссылка действует 30 минут.</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  return true;
}

export async function sendStudyReminderEmail(
  email: string,
  name: string | null,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://entgo.kz";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Короткая задача на сегодня",
      html: `<p>${name ? `${name}, ` : ""}в плане остались задачи на сегодня.</p><p><a href="${appUrl}/dashboard">Продолжить подготовку</a></p>`,
    }),
  });
  return response.ok;
}

export async function sendEmailVerification(
  email: string,
  verificationUrl: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`Email verification for ${email}: ${verificationUrl}`);
    }
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Подтвердите email entgo.kz",
      html: `<p>Подтвердите адрес почты, чтобы защитить аккаунт.</p><p><a href="${verificationUrl}">Подтвердить email</a></p><p>Ссылка действует 24 часа.</p>`,
    }),
  });
  return response.ok;
}
