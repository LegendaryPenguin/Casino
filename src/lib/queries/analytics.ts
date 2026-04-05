import type { RowDataPacket } from "mysql2/promise";
import { queryRows } from "@/lib/db";
import type { CasinoRow, GameRow, PlayerRow } from "@/lib/types";

export type AnalyticsQueryId =
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

export async function runAnalytics(
  id: AnalyticsQueryId,
  params: Record<string, unknown>,
): Promise<{ ok: true; rows: RowDataPacket[] } | { ok: false; error: string }> {
  switch (id) {
    case "casinos_by_location": {
      const location = String(params.location ?? "");
      if (!location)
        return { ok: false, error: "location is required" };
      const r = await queryRows<CasinoRow[]>(
        `SELECT CID, Name, Location, Phone, Capacity, Size, Manager FROM CASINO WHERE Location = ? ORDER BY Name`,
        [location],
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    case "vip_players": {
      const r = await queryRows<PlayerRow[]>(
        `SELECT PID, Email, VIP, Points FROM PLAYER WHERE VIP = 1 ORDER BY Points DESC`,
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    case "games_by_casino": {
      const cid = Number(params.cid);
      if (!Number.isFinite(cid))
        return { ok: false, error: "cid is required" };
      const r = await queryRows<
        (GameRow & {
          MinBet: string;
          MaxBet: string;
          ActiveTables: number;
        })[]
      >(
        `SELECT g.GameID, g.Name, g.Category, o.MinBet, o.MaxBet, o.ActiveTables
         FROM OFFERS o
         JOIN GAMES g ON g.GameID = o.GameID
         WHERE o.CID = ?
         ORDER BY g.Name`,
        [cid],
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    case "casinos_by_game": {
      const gameId = Number(params.gameId);
      if (!Number.isFinite(gameId))
        return { ok: false, error: "gameId is required" };
      const r = await queryRows<
        (CasinoRow & {
          MinBet: string;
          MaxBet: string;
          ActiveTables: number;
        })[]
      >(
        `SELECT c.CID, c.Name, c.Location, c.Phone, c.Capacity, c.Size, c.Manager,
                o.MinBet, o.MaxBet, o.ActiveTables
         FROM OFFERS o
         JOIN CASINO c ON c.CID = o.CID
         WHERE o.GameID = ?
         ORDER BY c.Name`,
        [gameId],
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    case "players_visited_casino": {
      const cid = Number(params.cid);
      if (!Number.isFinite(cid))
        return { ok: false, error: "cid is required" };
      const r = await queryRows<
        (PlayerRow & { VisitDate: string })[]
      >(
        `SELECT p.PID, p.Email, p.VIP, p.Points, v.Date AS VisitDate
         FROM VISITS v
         JOIN PLAYER p ON p.PID = v.PID
         WHERE v.CID = ?
         ORDER BY v.Date DESC, p.Email`,
        [cid],
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    case "players_above_points": {
      const minPoints = Number(params.minPoints);
      if (!Number.isFinite(minPoints))
        return { ok: false, error: "minPoints is required" };
      const r = await queryRows<PlayerRow[]>(
        `SELECT PID, Email, VIP, Points FROM PLAYER WHERE Points > ? ORDER BY Points DESC`,
        [minPoints],
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    case "visits_between_dates": {
      const start = String(params.startDate ?? "");
      const end = String(params.endDate ?? "");
      if (!start || !end)
        return { ok: false, error: "startDate and endDate are required" };
      const r = await queryRows<
        RowDataPacket[]
      >(
        `SELECT v.PID, v.CID, v.Date, p.Email, c.Name AS CasinoName
         FROM VISITS v
         JOIN PLAYER p ON p.PID = v.PID
         JOIN CASINO c ON c.CID = v.CID
         WHERE v.Date BETWEEN ? AND ?
         ORDER BY v.Date DESC, c.Name, p.Email`,
        [start, end],
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    case "casinos_above_capacity": {
      const minCap = Number(params.minCapacity);
      if (!Number.isFinite(minCap))
        return { ok: false, error: "minCapacity is required" };
      const r = await queryRows<CasinoRow[]>(
        `SELECT CID, Name, Location, Phone, Capacity, Size, Manager FROM CASINO WHERE Capacity > ? ORDER BY Capacity DESC`,
        [minCap],
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    case "active_tables_casino_game": {
      const cid = Number(params.cid);
      const gameId = Number(params.gameId);
      if (!Number.isFinite(cid) || !Number.isFinite(gameId))
        return { ok: false, error: "cid and gameId are required" };
      const r = await queryRows<RowDataPacket[]>(
        `SELECT o.CID, c.Name AS CasinoName, o.GameID, g.Name AS GameName, o.ActiveTables, o.MinBet, o.MaxBet
         FROM OFFERS o
         JOIN CASINO c ON c.CID = o.CID
         JOIN GAMES g ON g.GameID = o.GameID
         WHERE o.CID = ? AND o.GameID = ?`,
        [cid, gameId],
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    case "card_games": {
      const r = await queryRows<GameRow[]>(
        `SELECT GameID, Name, Category FROM GAMES WHERE Category = 'Card' ORDER BY Name`,
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    case "table_games": {
      const r = await queryRows<GameRow[]>(
        `SELECT GameID, Name, Category FROM GAMES WHERE Category = 'Table' ORDER BY Name`,
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    case "most_visited_casino": {
      const r = await queryRows<
        (CasinoRow & { visit_count: number })[]
      >(
        `SELECT c.CID, c.Name, c.Location, c.Phone, c.Capacity, c.Size, c.Manager,
                COUNT(v.PID) AS visit_count
         FROM CASINO c
         JOIN VISITS v ON v.CID = c.CID
         GROUP BY c.CID, c.Name, c.Location, c.Phone, c.Capacity, c.Size, c.Manager
         ORDER BY visit_count DESC
         LIMIT 1`,
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    case "top_players_by_points": {
      const raw = params.limit;
      const str = raw === undefined || raw === null ? "" : String(raw).trim();
      if (str === "") {
        const r = await queryRows<PlayerRow[]>(
          `SELECT PID, Email, VIP, Points FROM PLAYER ORDER BY Points DESC`,
        );
        return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
      }
      const n = Math.floor(Number(str));
      if (!Number.isFinite(n) || n < 1) {
        return { ok: false, error: "limit must be a positive integer" };
      }
      const lim = Math.min(1000, n);
      const r = await queryRows<PlayerRow[]>(
        `SELECT PID, Email, VIP, Points FROM PLAYER ORDER BY Points DESC LIMIT ${lim}`,
      );
      return r.ok ? { ok: true, rows: r.data } : { ok: false, error: r.error };
    }
    default:
      return { ok: false, error: "Unknown query" };
  }
}
