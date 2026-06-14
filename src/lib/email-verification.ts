import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { sendEmailVerification } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function createEmailVerification(
  userId: string,
  email: string,
  origin: string,
) {
  const token = randomBytes(32).toString("base64url");
  await prisma.emailVerificationToken.deleteMany({
    where: { userId, usedAt: null },
  });
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1_000),
    },
  });
  const path = `/verify-email?token=${encodeURIComponent(token)}`;
  const sent = await sendEmailVerification(email, `${origin}${path}`);
  return {
    sent,
    developmentPath:
      process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY
        ? path
        : undefined,
  };
}
