"use client";

import { Check, Heart, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SetTargetUniversityButton({
  universityId,
  isCurrentTarget,
}: {
  universityId: string;
  isCurrentTarget: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isTarget, setIsTarget] = useState(isCurrentTarget);
  const [error, setError] = useState("");

  async function handleSetTarget() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desiredUniversityId: isTarget ? null : universityId,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "?? ??????? ???????? ??????? ???????????.");
      }
      setIsTarget(!isTarget);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "?????? ??? ??????????.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleSetTarget}
        disabled={loading}
        className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-xs font-bold transition shadow-sm ${
          isTarget
            ? "border border-success/40 bg-[#edf9f2] text-success"
            : "border border-white/20 bg-white/10 text-white hover:bg-white/20"
        }`}
      >
        {loading ? (
          <LoaderCircle size={15} className="animate-spin" />
        ) : isTarget ? (
          <>
            <Check size={15} /> ??? ??????? ???????????
          </>
        ) : (
          <>
            <Heart size={15} /> ??????? ??? ??????? ???????????
          </>
        )}
      </button>
      {error && <p className="mt-2 text-center text-xs text-danger">{error}</p>}
    </div>
  );
}
