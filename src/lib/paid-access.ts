import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/authorization";
import { getActiveSubscription } from "@/lib/subscription";

export async function requirePaidUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isStaffRole(user.role) && !(await getActiveSubscription(user.id))) {
    redirect("/premium?required=1");
  }
  return user;
}
