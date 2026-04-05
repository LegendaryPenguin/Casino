"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";

type AnalyticsQueryId =
  | "casinos_by_location"
  | "vip_players"
  | "games_by_casino"
  | "casinos_by_game"
  | "players_visited_casino"
  | "players_above_points"
  | "visits_between_dates"
  | "casinos_above_capacity"
  | "active_tables_casino_game"
  | "card_games"
  | "table_games"
  | "most_visited_casino"
  | "top_players_by_points";

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
  const data = await res.json();
  if (!data.ok) {
    const msg =
      typeof data.error === "string"
        ? data.error
        : JSON.stringify(data.error);
    throw new Error(msg);
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
  const [locations, setLocations] = useState<string[]>([]);

  const [runningKey, setRunningKey] = useState<string | null>(null);

  const [rLocation, setRLocation] = useState("");
  const [rowsLocation, setRowsLocation] = useState<Record<
    string,
    unknown
  >[] | null>(null);

  const [rowsVip, setRowsVip] = useState<Record<string, unknown>[] | null>(
    null,
  );

  const [cidGames, setCidGames] = useState("");
  const [rowsGamesCasino, setRowsGamesCasino] = useState<Record<
    string,
    unknown
  >[] | null>(null);

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

  const [minPoints, setMinPoints] = useState("5000");
  const [rowsPoints, setRowsPoints] = useState<Record<
    string,
    unknown
  >[] | null>(null);

  const [d1, setD1] = useState("2025-09-01");
  const [d2, setD2] = useState("2026-12-31");
  const [rowsVisits, setRowsVisits] = useState<Record<
    string,
    unknown
  >[] | null>(null);

  const [minCap, setMinCap] = useState("800");
  const [rowsCap, setRowsCap] = useState<Record<string, unknown>[] | null>(
    null,
  );

  const [cidAct, setCidAct] = useState("");
  const [gidAct, setGidAct] = useState("");
  const [rowsAct, setRowsAct] = useState<Record<string, unknown>[] | null>(
    null,
  );

  const [rowsCard, setRowsCard] = useState<Record<string, unknown>[] | null>(
    null,
  );
  const [rowsTable, setRowsTable] = useState<Record<string, unknown>[] | null>(
    null,
  );
  const [rowsMost, setRowsMost] = useState<Record<string, unknown>[] | null>(
    null,
  );

  const [topLimit, setTopLimit] = useState("10");
  const [rowsTop, setRowsTop] = useState<Record<string, unknown>[] | null>(
    null,
  );

  const loadMeta = useCallback(async () => {
    const [c, g] = await Promise.all([
      fetch("/api/casinos/options").then((r) => r.json()),
      fetch("/api/games/options").then((r) => r.json()),
    ]);
    if (c.ok) {
      setCasinos(c.casinos);
      setLocations(c.locations);
    }
    if (g.ok) setGames(g.games);
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
        title="Casinos in a location"
        description="Filter casinos by city or region."
        running={runningKey === "loc"}
        rows={rowsLocation}
        onRun={() =>
          run("loc", "casinos_by_location", { location: rLocation }, (r) =>
            setRowsLocation(r),
          )
        }
      >
        <label className="flex max-w-md flex-col gap-1 text-xs text-[#8fa39a]">
          Location
          <select
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
            value={rLocation}
            onChange={(e) => setRLocation(e.target.value)}
          >
            <option value="">Select…</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </QueryBlock>

      <QueryBlock
        title="All VIP players"
        running={runningKey === "vip"}
        rows={rowsVip}
        onRun={() => run("vip", "vip_players", {}, (r) => setRowsVip(r))}
      >
        <p className="text-sm text-[#8fa39a]">No parameters required.</p>
      </QueryBlock>

      <QueryBlock
        title="Games offered by a casino"
        running={runningKey === "gc"}
        rows={rowsGamesCasino}
        onRun={() =>
          run(
            "gc",
            "games_by_casino",
            { cid: Number(cidGames) },
            (r) => setRowsGamesCasino(r),
          )
        }
      >
        <label className="flex max-w-md flex-col gap-1 text-xs text-[#8fa39a]">
          Casino
          <select
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
            value={cidGames}
            onChange={(e) => setCidGames(e.target.value)}
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
        title="Players above points threshold"
        running={runningKey === "pp"}
        rows={rowsPoints}
        onRun={() =>
          run(
            "pp",
            "players_above_points",
            { minPoints: Number(minPoints) },
            (r) => setRowsPoints(r),
          )
        }
      >
        <label className="flex max-w-xs flex-col gap-1 text-xs text-[#8fa39a]">
          Minimum points (exclusive)
          <input
            type="number"
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
            value={minPoints}
            onChange={(e) => setMinPoints(e.target.value)}
          />
        </label>
      </QueryBlock>

      <QueryBlock
        title="Visits between two dates"
        running={runningKey === "vd"}
        rows={rowsVisits}
        onRun={() =>
          run(
            "vd",
            "visits_between_dates",
            { startDate: d1, endDate: d2 },
            (r) => setRowsVisits(r),
          )
        }
      >
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
            Start
            <input
              type="date"
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              value={d1}
              onChange={(e) => setD1(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
            End
            <input
              type="date"
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              value={d2}
              onChange={(e) => setD2(e.target.value)}
            />
          </label>
        </div>
      </QueryBlock>

      <QueryBlock
        title="Casinos with capacity above threshold"
        running={runningKey === "cap"}
        rows={rowsCap}
        onRun={() =>
          run(
            "cap",
            "casinos_above_capacity",
            { minCapacity: Number(minCap) },
            (r) => setRowsCap(r),
          )
        }
      >
        <label className="flex max-w-xs flex-col gap-1 text-xs text-[#8fa39a]">
          Minimum capacity (exclusive)
          <input
            type="number"
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
            value={minCap}
            onChange={(e) => setMinCap(e.target.value)}
          />
        </label>
      </QueryBlock>

      <QueryBlock
        title="Active tables for casino + game"
        running={runningKey === "act"}
        rows={rowsAct}
        onRun={() =>
          run(
            "act",
            "active_tables_casino_game",
            { cid: Number(cidAct), gameId: Number(gidAct) },
            (r) => setRowsAct(r),
          )
        }
      >
        <div className="flex flex-wrap gap-4">
          <label className="flex min-w-[200px] flex-col gap-1 text-xs text-[#8fa39a]">
            Casino
            <select
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              value={cidAct}
              onChange={(e) => setCidAct(e.target.value)}
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
              value={gidAct}
              onChange={(e) => setGidAct(e.target.value)}
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
        title="All card games"
        running={runningKey === "card"}
        rows={rowsCard}
        onRun={() =>
          run("card", "card_games", {}, (r) => setRowsCard(r))
        }
      >
        <p className="text-sm text-[#8fa39a]">Category = Card Game</p>
      </QueryBlock>

      <QueryBlock
        title="All table games"
        running={runningKey === "tbl"}
        rows={rowsTable}
        onRun={() =>
          run("tbl", "table_games", {}, (r) => setRowsTable(r))
        }
      >
        <p className="text-sm text-[#8fa39a]">Category = Table Game</p>
      </QueryBlock>

      <QueryBlock
        title="Most visited casino"
        running={runningKey === "mvc"}
        rows={rowsMost}
        onRun={() =>
          run("mvc", "most_visited_casino", {}, (r) => setRowsMost(r))
        }
      >
        <p className="text-sm text-[#8fa39a]">
          Single row with highest visit count.
        </p>
      </QueryBlock>

      <QueryBlock
        title="Top players by points"
        running={runningKey === "top"}
        rows={rowsTop}
        onRun={() =>
          run(
            "top",
            "top_players_by_points",
            { limit: Number(topLimit) },
            (r) => setRowsTop(r),
          )
        }
      >
        <label className="flex max-w-xs flex-col gap-1 text-xs text-[#8fa39a]">
          Limit (max 50)
          <input
            type="number"
            min={1}
            max={50}
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
            value={topLimit}
            onChange={(e) => setTopLimit(e.target.value)}
          />
        </label>
      </QueryBlock>
    </div>
  );
}
