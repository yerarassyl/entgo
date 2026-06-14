import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const localHost = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  if (!localHost || process.env.LOCAL_ADMIN_DEMO !== "true") {
    return new Response("Not found", { status: 404 });
  }
  const user = await prisma.user.findUnique({ where: { email: "admin@entgo.local" } });
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return new Response("Local admin is not initialized", { status: 404 });
  }
  await createSession(user.id, request);
  return Response.redirect(new URL("/admin", request.url));
}
