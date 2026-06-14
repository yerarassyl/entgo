import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const STATE_COOKIE = "entgo_oauth_state";
const VERIFIER_COOKIE = "entgo_oauth_verifier";
const UNIVERSITY_COOKIE = "entgo_oauth_university";
const EXAM_DATE_COOKIE = "entgo_oauth_exam_date";
const CITY_COOKIE = "entgo_oauth_city";
const SCHOOL_COOKIE = "entgo_oauth_school";
const TARGET_COOKIE = "entgo_oauth_target";

export async function GET(request: Request) {
  const clientId = process.env.AUTH_GOOGLE_ID;
  if (!clientId) {
    return Response.redirect(new URL("/login?error=google_unavailable", request.url));
  }
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const requestedUniversity = new URL(request.url).searchParams.get("university");
  const requestedExamDate = new URL(request.url).searchParams.get("examDate");
  const requestedCity = new URL(request.url).searchParams.get("city");
  const requestedSchool = new URL(request.url).searchParams.get("school");
  const requestedTarget = new URL(request.url).searchParams.get("targetScore");

  const cookieStore = await cookies();
  const secure = origin.startsWith("https://");
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  cookieStore.set(VERIFIER_COOKIE, verifier, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  if (requestedUniversity && /^[a-z0-9-]{2,80}$/.test(requestedUniversity)) {
    cookieStore.set(UNIVERSITY_COOKIE, requestedUniversity, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  }
  if (requestedExamDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedExamDate)) {
    cookieStore.set(EXAM_DATE_COOKIE, requestedExamDate, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  }
  if (requestedCity && requestedCity.length <= 80) {
    cookieStore.set(CITY_COOKIE, Buffer.from(requestedCity).toString("base64url"), {
      httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600,
    });
  }
  if (requestedSchool && requestedSchool.length <= 120) {
    cookieStore.set(SCHOOL_COOKIE, Buffer.from(requestedSchool).toString("base64url"), {
      httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600,
    });
  }
  if (requestedTarget && /^(?:[6-9]\d|1[0-3]\d|140)$/.test(requestedTarget)) {
    cookieStore.set(TARGET_COOKIE, requestedTarget, {
      httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600,
    });
  }

  const authorization = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorization.searchParams.set("client_id", clientId);
  authorization.searchParams.set("redirect_uri", redirectUri);
  authorization.searchParams.set("response_type", "code");
  authorization.searchParams.set("scope", "openid email profile");
  authorization.searchParams.set("state", state);
  authorization.searchParams.set("code_challenge", challenge);
  authorization.searchParams.set("code_challenge_method", "S256");
  authorization.searchParams.set("prompt", "select_account");
  return Response.redirect(authorization);
}
