import type { RowDataPacket } from "mysql2/promise";
import { queryRows } from "@/lib/db";

export interface PlayerActivityFilters {
  startDate?: string;
  endDate?: string;
  cid?: number;
}

export interface PlayerActivityRow extends RowDataPacket {
  visit_date: string | Date;
  casino_name: string;
  location: string | null;
  games_offered_you_play: number;
}

/**
 * Per-visit activity for a single player. Joins VISITS ⨝ CASINO and uses a
 * correlated PLAYS ⨝ OFFERS subquery to count how many of the player's known
 * games are offered at each visited casino.
 *
 * `pid` is required; `startDate`, `endDate`, `cid` are optional dynamic
 * filters bound through placeholders (no string interpolation).
 */
export async function listPlayerActivity(
  pid: number,
  filters: PlayerActivityFilters = {},
) {
  const conditions: string[] = ["v.PID = ?"];
  const params: unknown[] = [pid, pid];

  if (filters.startDate) {
    conditions.push("v.Date >= ?");
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push("v.Date <= ?");
    params.push(filters.endDate);
  }
  if (filters.cid != null && Number.isFinite(filters.cid)) {
    conditions.push("v.CID = ?");
    params.push(filters.cid);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const sql = `
    SELECT
      v.Date     AS visit_date,
      c.Name     AS casino_name,
      c.Location AS location,
      (
        SELECT COUNT(*)
        FROM PLAYS pl
        JOIN OFFERS o
          ON o.GameID = pl.GameID
         AND o.CID    = v.CID
        WHERE pl.PID = ?
      )          AS games_offered_you_play
    FROM VISITS v
    JOIN CASINO c ON c.CID = v.CID
    ${where}
    ORDER BY v.Date DESC, c.Name
  `;

  return queryRows<PlayerActivityRow[]>(sql, params);
}
