/**
 * Read helpers powering the /play flow:
 *   /play           → list casinos
 *   /play/[cid]     → list games offered at a casino (OFFERS JOIN GAMES)
 *   /play/[cid]/... → fetch a single offer row (limits) before showing a table
 */
import type { RowDataPacket } from "mysql2/promise";
import { queryRows } from "@/lib/db";

export const ROULETTE_GAME_ID = 103;

export interface OfferedGameRow extends RowDataPacket {
  GameID: number;
  GameName: string;
  Category: string;
  MinBet: string | number;
  MaxBet: string | number;
  ActiveTables: number;
}

export async function listGamesAtCasino(cid: number) {
  const sql = `
    SELECT g.GameID, g.Name AS GameName, g.Category,
           o.MinBet, o.MaxBet, o.ActiveTables
    FROM OFFERS o
    JOIN GAMES g ON g.GameID = o.GameID
    WHERE o.CID = ?
    ORDER BY g.Category, g.Name
  `;
  return queryRows<OfferedGameRow[]>(sql, [cid]);
}

export interface OfferDetailRow extends RowDataPacket {
  CID: number;
  CasinoName: string;
  Location: string | null;
  GameID: number;
  GameName: string;
  Category: string;
  MinBet: string | number;
  MaxBet: string | number;
  ActiveTables: number;
}

export async function getCasinoGameOffer(cid: number, gameId: number) {
  const sql = `
    SELECT c.CID, c.Name AS CasinoName, c.Location,
           g.GameID, g.Name AS GameName, g.Category,
           o.MinBet, o.MaxBet, o.ActiveTables
    FROM OFFERS o
    JOIN CASINO c ON c.CID = o.CID
    JOIN GAMES  g ON g.GameID = o.GameID
    WHERE o.CID = ? AND o.GameID = ?
    LIMIT 1
  `;
  return queryRows<OfferDetailRow[]>(sql, [cid, gameId]);
}
