import type { RowDataPacket } from "mysql2/promise";
import { queryRows } from "@/lib/db";
import type { GameRow } from "@/lib/types";

export interface GameListRow extends RowDataPacket {
  GameID: number;
  Name: string;
  Category: string;
  offered_at: string | null;
}

export async function listGamesWithCasinos(category?: string) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (category?.trim()) {
    conditions.push("g.Category = ?");
    params.push(category.trim());
  }
  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT g.GameID, g.Name, g.Category,
           GROUP_CONCAT(DISTINCT c.Name ORDER BY c.Name SEPARATOR ', ') AS offered_at
    FROM GAMES g
    LEFT JOIN OFFERS o ON o.GameID = g.GameID
    LEFT JOIN CASINO c ON c.CID = o.CID
    ${where}
    GROUP BY g.GameID, g.Name, g.Category
    ORDER BY g.Category, g.Name
  `;

  return queryRows<GameListRow[]>(sql, params);
}

export async function distinctGameCategories() {
  return queryRows<Pick<GameRow, "Category">[]>(
    `SELECT DISTINCT Category FROM GAMES ORDER BY Category`,
  );
}

export async function listAllGameIdName() {
  return queryRows<Pick<GameRow, "GameID" | "Name">[]>(
    `SELECT GameID, Name FROM GAMES ORDER BY Name`,
  );
}
