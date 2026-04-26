"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Crown } from "lucide-react";
import { messageFromApiJson } from "@/lib/api-errors";

export function BecomeVipButton({
  cost,
  disabled = false,
}: {
  cost: number;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function upgrade() {
    if (pending || disabled) return;
    setPending(true);
    try {
      const res = await fetch("/api/account/upgrade-vip", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.error(messageFromApiJson(res, data));
        return;
      }
      toast.success("Welcome to VIP status.");
      router.refresh();
    } catch {
      toast.error("Network error while upgrading.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void upgrade()}
      disabled={pending || disabled}
      className="inline-flex items-center gap-2 rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/15 px-4 py-2.5 text-sm font-semibold text-[#e8d48b] transition-colors hover:bg-[#c9a227]/25 disabled:opacity-50"
    >
      <Crown className="h-4 w-4" aria-hidden />
      {pending ? "Upgrading…" : `Become VIP (${cost} points)`}
    </button>
  );
}
