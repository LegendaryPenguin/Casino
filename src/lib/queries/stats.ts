import type { RowDataPacket } from "mysql2/promise";
import { queryRows } from "@/lib/db";
import type { CasinoRow } from "@/lib/types";

interface StatsAggRow extends RowDataPacket {
  casinos: number;
  players: number;
  games: number;
  visits: number;
}

export async function getAggregateStats() {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM CASINO) AS casinos,
      (SELECT COUNT(*) FROM PLAYER) AS players,
      (SELECT COUNT(*) FROM GAMES) AS games,
      (SELECT COUNT(*) FROM VISITS) AS visits
  `;
  const r = await queryRows<StatsAggRow[]>(sql);
  if (!r.ok) return r;
  const row = r.data[0];
  return {
    ok: true as const,
    data: {
      casinos: Number(row.casinos),
      players: Number(row.players),
      games: Number(row.games),
      visits: Number(row.visits),
    },
  };
}

/** All casinos, ranked by visit count then capacity (no row cap — entirely from DB). */
export async function getFeaturedCasinos() {
  const sql = `
    SELECT c.CID, c.Name, c.Location, c.Phone, c.Capacity, c.Size, c.Manager,
           COUNT(v.PID) AS visit_count
    FROM CASINO c
    LEFT JOIN VISITS v ON v.CID = c.CID
    GROUP BY c.CID, c.Name, c.Location, c.Phone, c.Capacity, c.Size, c.Manager
    ORDER BY visit_count DESC, c.Capacity DESC
  `;
  return queryRows<(CasinoRow & { visit_count: number })[]>(sql);
}

interface VisitMonthRow extends RowDataPacket {
  ym: string;
  cnt: number;
}

/** Visits per calendar month for every month present in VISITS (full history, ascending for charts). */
export async function getVisitsByMonth() {
  const sql = `
    SELECT DATE_FORMAT(\`Date\`, '%Y-%m') AS ym, COUNT(*) AS cnt
    FROM VISITS
    GROUP BY DATE_FORMAT(\`Date\`, '%Y-%m')
    ORDER BY ym ASC
  `;
  return queryRows<VisitMonthRow[]>(sql);
}
