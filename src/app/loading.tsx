import { Brand } from "@/components/brand";

export default function Loading() {
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white/92">
        <div className="container-shell flex h-[76px] items-center justify-between">
          <Brand />
          <span className="h-10 w-28 animate-pulse rounded-full bg-[#eef0f4]" />
        </div>
      </header>
      <div className="container-shell py-12">
        <div className="h-4 w-36 animate-pulse rounded bg-[#e4e7ec]" />
        <div className="mt-5 h-12 w-3/4 max-w-2xl animate-pulse rounded-2xl bg-[#e4e7ec]" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-52 animate-pulse rounded-[28px] bg-white" />)}
        </div>
      </div>
    </main>
  );
}
