import { deleteMobileSession } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-response";

export function OPTIONS() {
  return mobileOptions();
}

export async function POST(request: Request) {
  await deleteMobileSession(request);
  return mobileJson({ ok: true });
}

