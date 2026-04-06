import { queryRows } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

/** Reads pre-joined aggregates via SQL VIEW (team/grad extra). */
export interface CasinoVisitSummaryRow extends RowDataPacket {
  CID: number;
  Name: string;
  Location: string | null;
  visit_count: number;
}

export async function getCasinoVisitSummaryFromView() {
  return queryRows<CasinoVisitSummaryRow[]>(
    `SELECT CID, Name, Location, visit_count FROM v_casino_visit_summary ORDER BY visit_count DESC, Name`,
  );
}
