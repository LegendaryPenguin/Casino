import { queryRows } from "@/lib/db";
import type { PlayerRow } from "@/lib/types";

export interface PlayerFilterParams {
  vipOnly?: boolean;
  sortPoints?: "asc" | "desc";
  emailSearch?: string;
}

export async function listPlayersFiltered(p: PlayerFilterParams) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (p.vipOnly) {
    conditions.push("p.VIP = 1");
  }
  if (p.emailSearch?.trim()) {
    conditions.push("p.Email LIKE ?");
    params.push(`%${p.emailSearch.trim()}%`);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const order = p.sortPoints === "asc" ? "ASC" : "DESC";

  const sql = `
    SELECT p.PID, p.Email, p.VIP, p.Points
    FROM PLAYER p
    ${where}
    ORDER BY p.Points ${order}, p.Email ASC
  `;

  return queryRows<PlayerRow[]>(sql, params);
}
