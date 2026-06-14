import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createMobileSession(userId: string, request: Request) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1_000);

  await prisma.session.create({
    data: {
      sessionToken: hashToken(token),
      userId,
      expires,
      userAgent: request.headers.get("user-agent")?.slice(0, 500),
    },
  });

  return { token, expires };
}

export async function getMobileSessionUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expires <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.user;
}

export async function deleteMobileSession(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
  if (!token) return;
  await prisma.session.deleteMany({ where: { sessionToken: hashToken(token) } });
}

