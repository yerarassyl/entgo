import { createRemoteJWKSet, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureUniversities } from "@/lib/universities";
import { getActiveSubscription } from "@/lib/subscription";

const googleJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("entgo_oauth_state")?.value;
  const verifier = cookieStore.get("entgo_oauth_verifier")?.value;
  const universitySlug = cookieStore.get("entgo_oauth_university")?.value;
  const examDateValue = cookieStore.get("entgo_oauth_exam_date")?.value;
  const cityValue = cookieStore.get("entgo_oauth_city")?.value;
  const schoolValue = cookieStore.get("entgo_oauth_school")?.value;
  const targetValue = cookieStore.get("entgo_oauth_target")?.value;
  const examDate = examDateValue ? new Date(`${examDateValue}T09:00:00`) : null;
  const city = cityValue ? Buffer.from(cityValue, "base64url").toString("utf8") : null;
  const school = schoolValue ? Buffer.from(schoolValue, "base64url").toString("utf8") : null;
  const targetScore = targetValue ? Number(targetValue) : null;
  cookieStore.delete("entgo_oauth_state");
  cookieStore.delete("entgo_oauth_verifier");
  cookieStore.delete("entgo_oauth_university");
  cookieStore.delete("entgo_oauth_exam_date");
  cookieStore.delete("entgo_oauth_city");
  cookieStore.delete("entgo_oauth_school");
  cookieStore.delete("entgo_oauth_target");

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return Response.redirect(new URL("/login?error=google_state", request.url));
  }
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) {
    return Response.redirect(new URL("/login?error=google_unavailable", request.url));
  }

  try {
    await ensureUniversities();
    const desiredUniversity = universitySlug
      ? await prisma.university.findUnique({ where: { slug: universitySlug }, select: { id: true } })
      : null;
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });
    const tokens = (await tokenResponse.json()) as { id_token?: string };
    if (!tokenResponse.ok || !tokens.id_token) throw new Error("Token exchange failed");
    const { payload } = await jwtVerify(tokens.id_token, googleJwks, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });
    if (!payload.sub || typeof payload.email !== "string" || payload.email_verified !== true) {
      throw new Error("Google account is not verified");
    }

    const user = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: payload.sub!,
          },
        },
        include: { user: true },
      });
      if (account) {
        return tx.user.update({
          where: { id: account.user.id },
          data: {
            desiredUniversityId:
              account.user.desiredUniversityId ?? desiredUniversity?.id,
            examDate: account.user.examDate ?? examDate,
            city: account.user.city ?? city,
            school: account.user.school ?? school,
            targetScore: account.user.targetScore ?? targetScore,
          },
        });
      }

      const existing = await tx.user.findUnique({ where: { email: payload.email as string } });
      const linkedUser =
        existing ??
        (await tx.user.create({
          data: {
            email: payload.email as string,
            name: typeof payload.name === "string" ? payload.name : null,
            emailVerified: new Date(),
            desiredUniversityId: desiredUniversity?.id,
            examDate,
            city,
            school,
            targetScore,
          },
        }));
      await tx.user.update({
        where: { id: linkedUser.id },
        data: {
          desiredUniversityId:
            linkedUser.desiredUniversityId ?? desiredUniversity?.id,
          examDate: linkedUser.examDate ?? examDate,
          city: linkedUser.city ?? city,
          school: linkedUser.school ?? school,
          targetScore: linkedUser.targetScore ?? targetScore,
        },
      });
      await tx.account.create({
        data: {
          userId: linkedUser.id,
          provider: "google",
          providerAccountId: payload.sub!,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: linkedUser.id,
          action: "GOOGLE_ACCOUNT_LINKED",
          entityType: "Account",
        },
      });
      return linkedUser;
    });
    await createSession(user.id, request);
    const destination = (await getActiveSubscription(user.id))
      ? "/dashboard"
      : "/premium?welcome=1";
    return Response.redirect(new URL(destination, request.url));
  } catch (error) {
    console.error("Google OAuth failed", error);
    return Response.redirect(new URL("/login?error=google_failed", request.url));
  }
}
