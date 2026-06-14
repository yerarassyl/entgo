import "server-only";
import type { UserRole } from "@/generated/prisma/enums";

const staffRoles = new Set<UserRole>([
  "ADMIN",
  "SUPERADMIN",
  "CONTENT_EDITOR",
  "SCHOOL_ADMIN",
  "TEACHER",
]);

export function isStaffRole(role: UserRole) {
  return staffRoles.has(role);
}

export function canEditContent(role: UserRole) {
  return role === "ADMIN" || role === "SUPERADMIN" || role === "CONTENT_EDITOR";
}

export function isSuperAdmin(role: UserRole) {
  return role === "SUPERADMIN";
}
