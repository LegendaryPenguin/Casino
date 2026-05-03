"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { History, Play, RotateCcw } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { messageFromApiJson } from "@/lib/api-errors";

type OptionCasino = { CID: number; Name: string };

type ActivityRow = {
  visit_date: string;
  casino_name: string;
  location: string | null;
  games_offered_you_play: number;
};

const COLUMNS = [
  { key: "visit_date", label: "Visit date" },
  { key: "casino_name", label: "Casino" },
  { key: "location", label: "Location" },
  { key: "games_offered_you_play", label: "Your games offered" },
];

export function MyActivity() {
  const [casinos, setCasinos] = useState<OptionCasino[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cid, setCid] = useState("");
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [running, setRunning] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/casinos/options");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.error(messageFromApiJson(res, data));
        return;
      }
      setCasinos(data.casinos as OptionCasino[]);
    } catch {
      toast.error("Network error loading casinos");
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const run = useCallback(async () => {
    setRunning(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (cid) params.set("cid", cid);

      const res = await fetch(
        `/api/account/activity?${params.toString()}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.error(messageFromApiJson(res, data));
        setRows([]);
        return;
      }
      setRows(data.rows as ActivityRow[]);
    } catch {
      toast.error("Network error");
      setRows([]);
    } finally {
      setRunning(false);
    }
  }, [startDate, endDate, cid]);

  const reset = () => {
    setStartDate("");
    setEndDate("");
    setCid("");
    setRows(null);
  };

  return (
    <GlowCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 text-[#e8d48b]">
            <History className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg text-[#e8d48b]">
              My recent activity
            </h2>
            <p className="mt-1 text-sm text-[#8fa39a]">
              Parameterized SQL: VISITS ⨝ CASINO scoped to your PID, with a
              correlated PLAYS ⨝ OFFERS subquery counting games you play that
              the casino offers. Filter by date range and/or casino.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
          From
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
          To
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
          Casino
          <select
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
          >
            <option value="">All casinos</option>
            {casinos.map((c) => (
              <option key={c.CID} value={c.CID}>
                {c.Name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/15 px-4 py-2 text-sm font-semibold text-[#e8d48b] transition-colors hover:bg-[#c9a227]/25 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {running ? "Running…" : "Run query"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-[#c9d4ce] transition-colors hover:bg-white/[0.06] disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {rows !== null && (
        <div className="mt-6">
          {rows.length === 0 ? (
            <EmptyState
              title="No visits found"
              description="No rows matched these filters. Try widening the date range or clearing the casino filter."
            />
          ) : (
            <DataTable columns={COLUMNS} rows={rows as unknown as Record<string, unknown>[]} />
          )}
        </div>
      )}
    </GlowCard>
  );
}
