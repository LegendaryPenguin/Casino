"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, UserPlus } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { messageFromApiJson } from "@/lib/api-errors";

type RevealState = {
  name: string;
  email: string;
  pid: number;
  points: number;
  createdPlayer: boolean;
};

const REEL_DIGITS = 4;

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [reveal, setReveal] = useState<RevealState | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.error(messageFromApiJson(res, data));
        return;
      }

      const player = data.player as {
        pid: number;
        email: string;
        points: number;
      };

      setReveal({
        name: data.user?.name ?? name,
        email: player.email,
        pid: player.pid,
        points: player.points,
        createdPlayer: Boolean(data.createdPlayer),
      });
    } catch {
      toast.error("Network error while creating account.");
    } finally {
      setSaving(false);
    }
  }

  if (reveal) {
    return (
      <SlotReveal
        reveal={reveal}
        onContinue={() => {
          router.push("/account");
          router.refresh();
        }}
      />
    );
  }

  return (
    <GlowCard className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 text-[#e8d48b]">
          <UserPlus className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">
            Create your account
          </h2>
          <p className="text-sm text-[#8fa39a]">
            Sign up, then spin for your starting balance.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
          Name
          <input
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white placeholder:text-[#5c6b64]"
            maxLength={100}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Player"
            autoComplete="name"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
          Email
          <input
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white placeholder:text-[#5c6b64]"
            maxLength={100}
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            autoComplete="email"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/15 px-4 py-2.5 text-sm font-semibold text-[#e8d48b] transition-colors hover:bg-[#c9a227]/25 disabled:opacity-50"
        >
          {saving ? "Creating account…" : "Create account"}
        </button>
      </form>
    </GlowCard>
  );
}

function SlotReveal({
  reveal,
  onContinue,
}: {
  reveal: RevealState;
  onContinue: () => void;
}) {
  const targetDigits = useMemo(
    () =>
      reveal.points
        .toString()
        .padStart(REEL_DIGITS, "0")
        .slice(-REEL_DIGITS)
        .split("")
        .map((d) => Number(d)),
    [reveal.points],
  );

  const [reels, setReels] = useState<number[]>(() =>
    Array.from({ length: REEL_DIGITS }, () => 0),
  );
  // -1 means still spinning
  const [stoppedAt, setStoppedAt] = useState<number>(-1);
  const [done, setDone] = useState(false);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setReels((prev) =>
        prev.map((v, i) =>
          i <= stoppedAt ? targetDigits[i] : (v + 1 + Math.floor(Math.random() * 9)) % 10,
        ),
      );
    }, 60);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [stoppedAt, targetDigits]);

  useEffect(() => {
    if (stoppedAt >= REEL_DIGITS - 1) {
      const t = setTimeout(() => setDone(true), 250);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStoppedAt((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [stoppedAt]);

  return (
    <GlowCard className="mx-auto max-w-xl text-center">
      <div className="mb-6 flex items-center justify-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 text-[#e8d48b]">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div className="text-left">
          <h2 className="font-display text-2xl font-semibold text-white">
            Welcome, {reveal.name}!
          </h2>
          <p className="text-sm text-[#8fa39a]">
            {reveal.createdPlayer
              ? "Spinning for your starting balance…"
              : "Loading your existing balance…"}
          </p>
        </div>
      </div>

      <div className="mx-auto mb-6 flex items-center justify-center gap-2">
        {reels.map((d, i) => (
          <div
            key={i}
            className={`flex h-20 w-14 items-center justify-center rounded-xl border bg-gradient-to-b from-[#1a221f] to-[#050807] font-display text-4xl font-bold tabular-nums shadow-inner ${
              i <= stoppedAt
                ? "border-[#c9a227]/60 text-[#e8d48b]"
                : "border-white/10 text-white"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <p className="text-sm text-[#8fa39a]">
        Player ID <span className="text-[#c9d4ce]">{reveal.pid}</span> ·{" "}
        <span className="text-[#c9d4ce]">{reveal.email}</span>
      </p>

      <button
        type="button"
        disabled={!done}
        onClick={onContinue}
        className="mt-6 w-full rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/15 px-4 py-2.5 text-sm font-semibold text-[#e8d48b] transition-colors hover:bg-[#c9a227]/25 disabled:opacity-40"
      >
        {done
          ? `Continue with ${reveal.points.toLocaleString()} points`
          : "Spinning…"}
      </button>
    </GlowCard>
  );
}
