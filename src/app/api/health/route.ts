export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    service: "entgo-web",
    timestamp: new Date().toISOString(),
  });
}
