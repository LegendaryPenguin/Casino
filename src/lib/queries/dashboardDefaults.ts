import type { RowDataPacket } from "mysql2/promise";
import { queryRows } from "@/lib/db";

/** Single row of bounds derived from live tables — used only for form defaults, not displayed as metrics. */
interface DashboardBoundsRow extends RowDataPacket {
  visit_min: Date | string | null;
  visit_max: Date | string | null;
  points_min: number | null;
  points_max: number | null;
  player_count: number;
  cap_min: number | null;
  cap_max: number | null;
}

function toDateInput(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.slice(0, 10);
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  return null;
}

export async function getDashboardFormDefaults() {
  const sql = `
    SELECT
      (SELECT MIN(\`Date\`) FROM VISITS) AS visit_min,
      (SELECT MAX(\`Date\`) FROM VISITS) AS visit_max,
      (SELECT MIN(Points) FROM PLAYER) AS points_min,
      (SELECT MAX(Points) FROM PLAYER) AS points_max,
      (SELECT COUNT(*) FROM PLAYER) AS player_count,
      (SELECT MIN(Capacity) FROM CASINO) AS cap_min,
      (SELECT MAX(Capacity) FROM CASINO) AS cap_max
  `;
  const r = await queryRows<DashboardBoundsRow[]>(sql);
  if (!r.ok) return r;

  const row = r.data[0];
  const pmin = row.points_min != null ? Number(row.points_min) : null;
  const pmax = row.points_max != null ? Number(row.points_max) : null;
  const cmin = row.cap_min != null ? Number(row.cap_min) : null;
  const cmax = row.cap_max != null ? Number(row.cap_max) : null;

  const suggestedMinPoints =
    pmin != null && pmax != null
      ? Math.floor((pmin + pmax) / 2)
      : null;
  const suggestedMinCapacity =
    cmin != null && cmax != null
      ? Math.floor((cmin + cmax) / 2)
      : null;

  return {
    ok: true as const,
    data: {
      visitDateMin: toDateInput(row.visit_min),
      visitDateMax: toDateInput(row.visit_max),
      pointsMin: pmin,
      pointsMax: pmax,
      suggestedMinPoints,
      casinoCapacityMin: cmin,
      casinoCapacityMax: cmax,
      suggestedMinCapacity,
      playerCount: Number(row.player_count),
    },
  };
}
