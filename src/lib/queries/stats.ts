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

/** Featured: top casinos by visit count, then capacity */
export async function getFeaturedCasinos(limit = 4) {
  const sql = `
    SELECT c.CID, c.Name, c.Location, c.Phone, c.Capacity, c.Size, c.Manager,
           COUNT(v.PID) AS visit_count
    FROM CASINO c
    LEFT JOIN VISITS v ON v.CID = c.CID
    GROUP BY c.CID, c.Name, c.Location, c.Phone, c.Capacity, c.Size, c.Manager
    ORDER BY visit_count DESC, c.Capacity DESC
    LIMIT ?
  `;
  return queryRows<
    (CasinoRow & { visit_count: number })[]
  >(sql, [limit]);
}

interface VisitMonthRow extends RowDataPacket {
  ym: string;
  cnt: number;
}

/** For charts: visits per month (recent) */
export async function getVisitsByMonth(limitMonths = 6) {
  const sql = `
    SELECT DATE_FORMAT(Date, '%Y-%m') AS ym, COUNT(*) AS cnt
    FROM VISITS
    GROUP BY ym
    ORDER BY ym DESC
    LIMIT ?
  `;
  return queryRows<VisitMonthRow[]>(sql, [limitMonths]);
}
