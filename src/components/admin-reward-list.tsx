"use client";

import { useState } from "react";

type RewardRow = {
  id: string;
  user: string;
  score: number;
  proofUrl: string;
  status: "SUBMITTED" | "REVIEWING" | "APPROVED" | "REJECTED" | "DELIVERED";
};

export function AdminRewardList({ initialClaims }: { initialClaims: RewardRow[] }) {
  const [claims, setClaims] = useState(initialClaims);

  async function updateStatus(id: string, status: RewardRow["status"]) {
    const response = await fetch(`/api/admin/rewards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      setClaims((current) =>
        current.map((claim) => (claim.id === id ? { ...claim, status } : claim)),
      );
    }
  }

  return (
    <div className="mt-5 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-white">
      {claims.map((claim) => (
        <div key={claim.id} className="grid gap-3 p-5 text-sm sm:grid-cols-[1fr_90px_140px] sm:items-center">
          <div><p className="font-semibold">{claim.user}</p><a href={claim.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-muted underline">Открыть подтверждение · {claim.score} баллов</a></div>
          <strong>{claim.score}</strong>
          <select value={claim.status} onChange={(event) => void updateStatus(claim.id, event.target.value as RewardRow["status"])} className="h-10 rounded-xl border border-line bg-white px-3 text-xs font-semibold">
            <option value="SUBMITTED">Отправлена</option>
            <option value="REVIEWING">Проверяется</option>
            <option value="APPROVED">Одобрена</option>
            <option value="REJECTED">Отклонена</option>
            <option value="DELIVERED">Подарок выдан</option>
          </select>
        </div>
      ))}
      {!claims.length && <p className="p-6 text-sm text-muted">Заявок на подарки пока нет.</p>}
    </div>
  );
}
