import { queryRows } from "@/lib/db";
import type { CasinoRow } from "@/lib/types";

const SORT_COLUMNS: Record<string, string> = {
  name: "c.Name",
  capacity: "c.Capacity",
  size: "c.Size",
  location: "c.Location",
};

export interface CasinoFilterParams {
  location?: string;
  manager?: string;
  minCapacity?: number;
  minSize?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export async function listCasinosFiltered(p: CasinoFilterParams) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (p.location) {
    conditions.push("c.Location = ?");
    params.push(p.location);
  }
  if (p.manager) {
    conditions.push("c.Manager = ?");
    params.push(p.manager);
  }
  if (p.minCapacity != null && !Number.isNaN(p.minCapacity)) {
    conditions.push("c.Capacity >= ?");
    params.push(p.minCapacity);
  }
  if (p.minSize != null && !Number.isNaN(p.minSize)) {
    conditions.push("c.Size >= ?");
    params.push(p.minSize);
  }
  if (p.search?.trim()) {
    conditions.push("c.Name LIKE ?");
    params.push(`%${p.search.trim()}%`);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sortCol = SORT_COLUMNS[p.sort ?? "name"] ?? SORT_COLUMNS.name;
  const order = p.order === "desc" ? "DESC" : "ASC";

  const sql = `
    SELECT c.CID, c.Name, c.Location, c.Phone, c.Capacity, c.Size, c.Manager
    FROM CASINO c
    ${where}
    ORDER BY ${sortCol} ${order}
  `;

  return queryRows<CasinoRow[]>(sql, params);
}

export async function distinctCasinoLocations() {
  return queryRows<Pick<CasinoRow, "Location">[]>(
    `SELECT DISTINCT Location FROM CASINO ORDER BY Location`,
  );
}

export async function distinctCasinoManagers() {
  return queryRows<Pick<CasinoRow, "Manager">[]>(
    `SELECT DISTINCT Manager FROM CASINO ORDER BY Manager`,
  );
}

export async function listAllCasinoIdName() {
  return queryRows<Pick<CasinoRow, "CID" | "Name">[]>(
    `SELECT CID, Name FROM CASINO ORDER BY Name`,
  );
}
