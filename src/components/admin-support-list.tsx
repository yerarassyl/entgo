"use client";

import { ExternalLink, LoaderCircle, MessageSquareReply } from "lucide-react";
import { useState } from "react";

type Ticket = {
  id: string;
  message: string;
  pageUrl: string;
  screenshotAttached: boolean;
  status: "NEW" | "IN_PROGRESS" | "ANSWERED" | "CLOSED";
  response: string | null;
  user: string;
  subscription: string;
  createdAt: string;
};

export function AdminSupportList({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [pending, setPending] = useState<string>();

  async function save(ticket: Ticket, status: Ticket["status"], response: string) {
    setPending(ticket.id);
    const result = await fetch(`/api/admin/support/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, response }),
    });
    if (result.ok) setTickets((rows) => rows.map((row) => row.id === ticket.id ? { ...row, status, response } : row));
    setPending(undefined);
  }

  return <div className="mt-5 space-y-4">{tickets.map((ticket) => <article key={ticket.id} className="rounded-[24px] border border-line bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-muted">{ticket.user} · {ticket.subscription}</p><p className="mt-2 text-sm leading-6">{ticket.message}</p></div><span className="rounded-full bg-paper px-3 py-2 text-xs font-bold">{ticket.status}</span></div>
    <div className="mt-4 flex flex-wrap gap-3 text-xs"><a href={ticket.pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold">Страница <ExternalLink size={13} /></a>{ticket.screenshotAttached && <a href={`/api/admin/support/${ticket.id}`} target="_blank" rel="noreferrer" className="font-semibold">Открыть скриншот</a>}<span className="text-muted">{ticket.createdAt}</span></div>
    <textarea defaultValue={ticket.response ?? ""} id={`response-${ticket.id}`} rows={3} placeholder="Ответ пользователю" className="mt-4 w-full rounded-xl border border-line p-3 text-sm" />
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <select id={`status-${ticket.id}`} defaultValue={ticket.status} className="h-10 rounded-xl border border-line bg-white px-3 text-xs"><option value="NEW">Новый</option><option value="IN_PROGRESS">В работе</option><option value="ANSWERED">Ответ отправлен</option><option value="CLOSED">Закрыт</option></select>
      <button onClick={() => { const response = (document.getElementById(`response-${ticket.id}`) as HTMLTextAreaElement).value; const status = (document.getElementById(`status-${ticket.id}`) as HTMLSelectElement).value as Ticket["status"]; void save(ticket, status, response); }} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-white">{pending === ticket.id ? <LoaderCircle size={14} className="animate-spin" /> : <MessageSquareReply size={14} />} Сохранить ответ</button>
    </div>
  </article>)}{!tickets.length && <p className="rounded-2xl bg-white p-6 text-sm text-muted">Новых обращений нет.</p>}</div>;
}
