"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN" | "SUPERADMIN";
  premium: boolean;
  createdAt: string;
};

export function AdminUserList({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUser[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [pending, setPending] = useState<string>();

  async function updateUser(
    id: string,
    data: { role?: AdminUser["role"]; premium?: boolean },
  ) {
    setPending(id);
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      setUsers((current) =>
        current.map((user) => (user.id === id ? { ...user, ...data } : user)),
      );
    }
    setPending(undefined);
  }

  return (
    <div className="mt-5 overflow-hidden rounded-[24px] border border-line bg-white">
      <div className="hidden grid-cols-[1fr_150px_130px_110px] gap-3 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[.1em] text-muted sm:grid">
        <span>Пользователь</span><span>Роль</span><span className="hidden sm:block">Подписка</span><span className="hidden sm:block">Создан</span>
      </div>
      <div className="divide-y divide-line">
        {users.map((user) => (
          <div key={user.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_150px_130px_110px] sm:items-center sm:py-4">
            <div className="min-w-0"><p className="break-words text-sm font-semibold">{user.name}</p><p className="mt-1 break-all text-xs text-muted">{user.email}</p><p className="mt-2 text-xs text-muted sm:hidden">Создан: {user.createdAt}</p></div>
            <label className="text-xs font-semibold text-muted sm:contents"><span className="mb-1 block sm:hidden">Роль</span><select value={user.role} disabled={pending === user.id || user.id === currentUserId} onChange={(event) => void updateUser(user.id, { role: event.target.value as AdminUser["role"] })} className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold disabled:opacity-45">
              <option value="STUDENT">student</option>
              <option value="ADMIN">admin</option>
              <option value="SUPERADMIN">superadmin</option>
            </select></label>
            <button disabled={pending === user.id} onClick={() => void updateUser(user.id, { premium: !user.premium })} className={`flex min-h-11 items-center justify-center rounded-full px-3 text-xs font-bold ${user.premium ? "bg-ink text-white" : "border border-line"}`}>
              {pending === user.id ? <LoaderCircle size={14} className="animate-spin" /> : user.premium ? "Premium активен" : "Выдать Premium"}
            </button>
            <span className="hidden text-xs text-muted sm:block">{user.createdAt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
