"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Coins, History, Sparkles } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { messageFromApiJson } from "@/lib/api-errors";

type BetType = "red" | "black" | "number";

type ApiSpinResult = {
  pid: number;
  cid: number;
  gameId: number;
  bet:
    | { type: "red" | "black"; amount: number }
    | { type: "number"; amount: number; value: number };
  spin: { number: number; color: "red" | "black" | "green" };
  win: boolean;
  delta: number;
  pointsBefore: number;
  pointsAfter: number;
  firstPlay: boolean;
};

type Spin = ApiSpinResult & { id: number };

const SPIN_ANIM_MS = 1600;

function colorClasses(color: "red" | "black" | "green") {
  if (color === "red") return "bg-red-700 text-white border-red-500";
  if (color === "black") return "bg-[#0c1210] text-white border-white/30";
  return "bg-emerald-700 text-white border-emerald-500";
}

export function RouletteTable({
  cid,
  casinoName,
  minBet,
  maxBet,
  activeTables,
  initialBalance,
}: {
  cid: number;
  casinoName: string;
  minBet: number;
  maxBet: number;
  activeTables: number;
  initialBalance: number;
}) {
  const router = useRouter();

  const [betType, setBetType] = useState<BetType>("red");
  const [betValue, setBetValue] = useState<number>(7);
  const [betAmount, setBetAmount] = useState<number>(
    Math.max(minBet, Math.min(maxBet, 10)),
  );
  const [balance, setBalance] = useState<number>(initialBalance);

  const [spinning, setSpinning] = useState(false);
  const [reelNumber, setReelNumber] = useState<number>(0);
  const [reelColor, setReelColor] = useState<"red" | "black" | "green">(
    "green",
  );
  const [latest, setLatest] = useState<Spin | null>(null);
  const [history, setHistory] = useState<Spin[]>([]);

  const tickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  function clampBet(n: number): number {
    if (!Number.isFinite(n)) return minBet;
    const i = Math.floor(n);
    if (i < minBet) return minBet;
    if (i > maxBet) return maxBet;
    return i;
  }

  async function spin() {
    if (spinning) return;
    if (betAmount < minBet || betAmount > maxBet) {
      toast.error(`Bet must be between ${minBet} and ${maxBet}.`);
      return;
    }
    if (betAmount > balance) {
      toast.error("Not enough points for that bet.");
      return;
    }

    setSpinning(true);
    setLatest(null);

    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const r = Math.floor(Math.random() * 37);
      setReelNumber(r);
      setReelColor(reelColorFor(r));
    }, 70);

    const startedAt = Date.now();
    try {
      const res = await fetch("/api/play/roulette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          betType === "number"
            ? { cid, bet: betAmount, betType, betValue }
            : { cid, bet: betAmount, betType },
        ),
      });
      const data = await res.json().catch(() => ({}));

      const wait = Math.max(0, SPIN_ANIM_MS - (Date.now() - startedAt));
      await new Promise((r) => setTimeout(r, wait));

      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }

      if (!res.ok || !data.ok) {
        toast.error(messageFromApiJson(res, data));
        return;
      }

      const result = data.result as ApiSpinResult;
      setReelNumber(result.spin.number);
      setReelColor(result.spin.color);
      setBalance(result.pointsAfter);
      const spin: Spin = { ...result, id: Date.now() };
      setLatest(spin);
      setHistory((h) => [spin, ...h].slice(0, 10));

      if (result.win) {
        toast.success(`+${result.delta.toLocaleString()} points!`);
      } else {
        toast(`No luck this time. -${Math.abs(result.delta).toLocaleString()} points.`);
      }

      // Refresh server-rendered balance pills (header on this page, /account, etc.)
      router.refresh();
    } catch {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      toast.error("Network error while spinning.");
    } finally {
      setSpinning(false);
    }
  }

  const insufficient = balance < minBet;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
      <GlowCard>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 text-[#e8d48b]">
            <Coins className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="font-display text-lg text-[#e8d48b]">Place a bet</h2>
        </div>
        <p className="mt-2 text-sm text-[#8fa39a]">
          {casinoName} · Min {minBet} / Max {maxBet} · {activeTables}{" "}
          active tables
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#8fa39a]">
              Bet type
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <BetTypeButton
                active={betType === "red"}
                onClick={() => setBetType("red")}
                label="Red"
                hint="1:1"
                tone="red"
              />
              <BetTypeButton
                active={betType === "black"}
                onClick={() => setBetType("black")}
                label="Black"
                hint="1:1"
                tone="black"
              />
              <BetTypeButton
                active={betType === "number"}
                onClick={() => setBetType("number")}
                label="Number"
                hint="35:1"
                tone="gold"
              />
            </div>
          </div>

          {betType === "number" ? (
            <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
              Number (0–36)
              <input
                type="number"
                min={0}
                max={36}
                value={betValue}
                onChange={(e) => {
                  const n = Math.floor(Number(e.target.value));
                  if (Number.isFinite(n)) {
                    setBetValue(Math.max(0, Math.min(36, n)));
                  }
                }}
                className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
            Bet amount (points)
            <input
              type="number"
              min={minBet}
              max={maxBet}
              value={betAmount}
              onChange={(e) =>
                setBetAmount(clampBet(Number(e.target.value)))
              }
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
            />
            <span className="text-[11px] text-[#6b7f76]">
              Balance: {balance.toLocaleString()} pts
            </span>
          </label>

          <button
            type="button"
            onClick={() => void spin()}
            disabled={spinning || insufficient}
            className="w-full rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/15 px-4 py-2.5 text-sm font-semibold text-[#e8d48b] transition-colors hover:bg-[#c9a227]/25 disabled:opacity-50"
          >
            {spinning
              ? "Spinning…"
              : insufficient
                ? `Need ${minBet} pts to play`
                : `Spin (risk ${betAmount.toLocaleString()} pts)`}
          </button>
        </div>
      </GlowCard>

      <div className="space-y-6">
        <GlowCard>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 text-[#e8d48b]">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="font-display text-lg text-[#e8d48b]">The wheel</h2>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div
              className={`flex h-32 w-32 items-center justify-center rounded-full border-4 font-display text-5xl font-bold tabular-nums shadow-2xl transition-colors ${colorClasses(
                reelColor,
              )} ${spinning ? "animate-pulse" : ""}`}
            >
              {reelNumber}
            </div>
          </div>

          <div className="mt-6 min-h-[60px] text-center">
            {latest ? (
              <div>
                <p className="text-sm text-[#8fa39a]">
                  Landed on{" "}
                  <span className="font-semibold text-white">
                    {latest.spin.number}
                  </span>{" "}
                  ({latest.spin.color})
                </p>
                {latest.win ? (
                  <p className="mt-1 font-display text-xl text-emerald-300">
                    +{latest.delta.toLocaleString()} points
                  </p>
                ) : (
                  <p className="mt-1 font-display text-xl text-red-300">
                    −{Math.abs(latest.delta).toLocaleString()} points
                  </p>
                )}
                {latest.firstPlay ? (
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-[#c9a227]">
                    First roulette play recorded in PLAYS
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-[#6b7f76]">
                Place a bet and spin the wheel.
              </p>
            )}
          </div>
        </GlowCard>

        <GlowCard>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#c9d4ce]">
              <History className="h-4 w-4" aria-hidden />
            </span>
            <h2 className="font-display text-base text-[#e8d48b]">
              Recent spins
            </h2>
          </div>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-[#6b7f76]">
              Your spins this session will appear here.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-white/5">
              {history.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${colorClasses(
                        s.spin.color,
                      )}`}
                    >
                      {s.spin.number}
                    </span>
                    <span className="text-[#8fa39a]">
                      {betDescription(s.bet)}
                    </span>
                  </span>
                  <span
                    className={`tabular-nums ${
                      s.win ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {s.win ? "+" : "−"}
                    {Math.abs(s.delta).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlowCard>
      </div>
    </div>
  );
}

function BetTypeButton({
  active,
  onClick,
  label,
  hint,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  tone: "red" | "black" | "gold";
}) {
  const ring =
    tone === "red"
      ? "border-red-500"
      : tone === "black"
        ? "border-white/40"
        : "border-[#c9a227]/60";
  const bg =
    tone === "red"
      ? "bg-red-700/40"
      : tone === "black"
        ? "bg-[#0c1210]"
        : "bg-[#c9a227]/15";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? `${ring} ${bg} text-white`
          : "border-white/10 bg-[#050807] text-[#c9d4ce] hover:bg-white/5"
      }`}
    >
      <div>{label}</div>
      <div className="text-[10px] font-normal uppercase tracking-wide text-[#8fa39a]">
        {hint}
      </div>
    </button>
  );
}

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);
function reelColorFor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

function betDescription(bet: ApiSpinResult["bet"]): string {
  if (bet.type === "number") {
    return `Number ${bet.value} · ${bet.amount} pts`;
  }
  return `${bet.type === "red" ? "Red" : "Black"} · ${bet.amount} pts`;
}
