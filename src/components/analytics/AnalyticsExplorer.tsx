"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { messageFromApiJson } from "@/lib/api-errors";

type AnalyticsQueryId =
  | "casinos_by_game"
  | "players_visited_casino"
  | "players_played_at_casino"
  | "players_by_visits";

type OptionCasino = { CID: number; Name: string };
type OptionGame = { GameID: number; Name: string };

async function runQuery(
  queryId: AnalyticsQueryId,
  params: Record<string, unknown>,
): Promise<Record<string, unknown>[]> {
  const res = await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ queryId, params }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(messageFromApiJson(res, data));
  }
  return data.rows as Record<string, unknown>[];
}

function rowsToColumns(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]).map((key) => ({
    key,
    label: key.replace(/_/g, " "),
  }));
}

function QueryBlock({
  title,
  description,
  children,
  onRun,
  rows,
  running,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onRun: () => void;
  rows: Record<string, unknown>[] | null;
  running: boolean;
}) {
  const cols = rows && rows.length ? rowsToColumns(rows) : [];

  return (
    <GlowCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-display text-lg text-[#e8d48b]">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-[#8fa39a]">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/15 px-4 py-2 text-sm font-semibold text-[#e8d48b] transition-colors hover:bg-[#c9a227]/25 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {running ? "Running…" : "Run query"}
        </button>
      </div>
      <div className="mt-4">{children}</div>
      {rows && (
        <div className="mt-6">
          {rows.length === 0 ? (
            <EmptyState title="No rows" description="Try different parameters." />
          ) : (
            <DataTable columns={cols} rows={rows} />
          )}
        </div>
      )}
    </GlowCard>
  );
}

export function AnalyticsExplorer() {
  const [casinos, setCasinos] = useState<OptionCasino[]>([]);
  const [games, setGames] = useState<OptionGame[]>([]);

  const [runningKey, setRunningKey] = useState<string | null>(null);

  const [gidCasinos, setGidCasinos] = useState("");
  const [rowsCasinosGame, setRowsCasinosGame] = useState<Record<
    string,
    unknown
  >[] | null>(null);

  const [cidVisits, setCidVisits] = useState("");
  const [rowsVisitPlayers, setRowsVisitPlayers] = useState<Record<
    string,
    unknown
  >[] | null>(null);

  const [cidPlayed, setCidPlayed] = useState("");
  const [gidPlayed, setGidPlayed] = useState("");
  const [rowsPlayed, setRowsPlayed] = useState<Record<
    string,
    unknown
  >[] | null>(null);

  const [rowsPlayerRanking, setRowsPlayerRanking] = useState<Record<
    string,
    unknown
  >[] | null>(null);

  const loadMeta = useCallback(async () => {
    const [resC, resG] = await Promise.all([
      fetch("/api/casinos/options"),
      fetch("/api/games/options"),
    ]);
    const c = await resC.json().catch(() => ({}));
    const g = await resG.json().catch(() => ({}));

    if (!resC.ok || !c.ok) {
      toast.error(messageFromApiJson(resC, c));
    } else {
      setCasinos(c.casinos);
    }
    if (!resG.ok || !g.ok) {
      toast.error(messageFromApiJson(resG, g));
    } else {
      setGames(g.games);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const run = async (
    key: string,
    queryId: AnalyticsQueryId,
    params: Record<string, unknown>,
    setter: (r: Record<string, unknown>[]) => void,
  ) => {
    setRunningKey(key);
    try {
      const rows = await runQuery(queryId, params);
      setter(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Query failed");
      setter([]);
    } finally {
      setRunningKey(null);
    }
  };

  return (
    <div className="space-y-10">
      <QueryBlock
        title="Casinos offering a game"
        running={runningKey === "cg"}
        rows={rowsCasinosGame}
        onRun={() =>
          run(
            "cg",
            "casinos_by_game",
            { gameId: Number(gidCasinos) },
            (r) => setRowsCasinosGame(r),
          )
        }
      >
        <label className="flex max-w-md flex-col gap-1 text-xs text-[#8fa39a]">
          Game
          <select
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
            value={gidCasinos}
            onChange={(e) => setGidCasinos(e.target.value)}
          >
            <option value="">Select…</option>
            {games.map((g) => (
              <option key={g.GameID} value={g.GameID}>
                {g.Name}
              </option>
            ))}
          </select>
        </label>
      </QueryBlock>

      <QueryBlock
        title="Players who visited a casino"
        running={runningKey === "pv"}
        rows={rowsVisitPlayers}
        onRun={() =>
          run(
            "pv",
            "players_visited_casino",
            { cid: Number(cidVisits) },
            (r) => setRowsVisitPlayers(r),
          )
        }
      >
        <label className="flex max-w-md flex-col gap-1 text-xs text-[#8fa39a]">
          Casino
          <select
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
            value={cidVisits}
            onChange={(e) => setCidVisits(e.target.value)}
          >
            <option value="">Select…</option>
            {casinos.map((c) => (
              <option key={c.CID} value={c.CID}>
                {c.Name}
              </option>
            ))}
          </select>
        </label>
      </QueryBlock>

      <QueryBlock
        title="Players who played a game at a casino"
        description="Joins PLAYER ⨝ PLAYS ⨝ GAMES ⨝ VISITS ⨝ CASINO. Returns players who have a PLAYS row for the chosen game and a VISITS row for the chosen casino."
        running={runningKey === "pgc"}
        rows={rowsPlayed}
        onRun={() =>
          run(
            "pgc",
            "players_played_at_casino",
            { cid: Number(cidPlayed), gameId: Number(gidPlayed) },
            (r) => setRowsPlayed(r),
          )
        }
      >
        <div className="flex flex-wrap gap-4">
          <label className="flex min-w-[200px] flex-col gap-1 text-xs text-[#8fa39a]">
            Casino
            <select
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              value={cidPlayed}
              onChange={(e) => setCidPlayed(e.target.value)}
            >
              <option value="">Select…</option>
              {casinos.map((c) => (
                <option key={c.CID} value={c.CID}>
                  {c.Name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[200px] flex-col gap-1 text-xs text-[#8fa39a]">
            Game
            <select
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              value={gidPlayed}
              onChange={(e) => setGidPlayed(e.target.value)}
            >
              <option value="">Select…</option>
              {games.map((g) => (
                <option key={g.GameID} value={g.GameID}>
                  {g.Name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </QueryBlock>

      <QueryBlock
        title="Players ranked by visits"
        description="LEFT JOIN of PLAYER ⨝ VISITS, grouped by player. Ranks every player by their total visit count (players with zero visits appear last)."
        running={runningKey === "pr"}
        rows={rowsPlayerRanking}
        onRun={() =>
          run("pr", "players_by_visits", {}, (r) => setRowsPlayerRanking(r))
        }
      >
        <p className="text-xs text-[#5c6b64]">No parameters — runs against all players.</p>
      </QueryBlock>
    </div>
  );
}
