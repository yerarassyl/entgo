"use client";

import { Check, LoaderCircle, X } from "lucide-react";
import { useState } from "react";

type Submission = { id: string; contentType: string; status: "REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_CHANGES"; createdAt: string };

export function AdminSubmissionList({ items, canModerate }: { items: Submission[]; canModerate: boolean }) {
  const [rows, setRows] = useState(items);
  const [pending, setPending] = useState<string>();
  async function moderate(id: string, status: "APPROVED" | "REJECTED" | "NEEDS_CHANGES") {
    setPending(id);
    const response = await fetch(`/api/admin/submissions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) setRows((current) => current.map((row) => row.id === id ? { ...row, status } : row));
    setPending(undefined);
  }
  return <div className="mt-5 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-white">{rows.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5 text-sm"><span><strong>{item.contentType}</strong><span className="ml-3 text-muted">{item.createdAt}</span></span><div className="flex items-center gap-2"><span className="rounded-full bg-paper px-3 py-2 text-xs font-bold">{item.status}</span>{canModerate && item.status === "REVIEW" && <><button onClick={() => void moderate(item.id, "APPROVED")} className="grid size-9 place-items-center rounded-full bg-success text-white" aria-label="Одобрить">{pending === item.id ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={15} />}</button><button onClick={() => void moderate(item.id, "NEEDS_CHANGES")} className="h-9 rounded-full border border-line px-3 text-xs font-bold" aria-label="Вернуть на доработку">Доработать</button><button onClick={() => void moderate(item.id, "REJECTED")} className="grid size-9 place-items-center rounded-full bg-danger text-white" aria-label="Отклонить"><X size={15} /></button></>}</div></div>)}{!rows.length && <p className="p-6 text-sm text-muted">Предложений пока нет.</p>}</div>;
}
