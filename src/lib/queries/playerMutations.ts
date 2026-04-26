/**
 * Transactional UPDATE on one pooled connection: SET SESSION, read (FOR UPDATE),
 * UPDATE PLAYER, INSERT audit_log — satisfies "session" + "database update" rubric.
 */
import crypto from "crypto";
import type { RowDataPacket } from "mysql2/promise";
import { getPool } from "@/lib/db";

const STARTING_POINTS_MIN = 100;
const STARTING_POINTS_MAX = 1000;
const VIP_UPGRADE_COST = 100;
const SIGNUP_PID_BASE = 2000;

export const VIP_COST_POINTS = VIP_UPGRADE_COST;

// European single-zero roulette wheel
const RED_NUMBERS: ReadonlySet<number> = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export type RouletteBetType = "red" | "black" | "number";

export type RouletteColor = "red" | "black" | "green";

export function rouletteColorFor(n: number): RouletteColor {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

function rollStartingPoints(): number {
  const span = STARTING_POINTS_MAX - STARTING_POINTS_MIN + 1;
  return STARTING_POINTS_MIN + Math.floor(Math.random() * span);
}

export type PlayerSnapshot = {
  pid: number;
  email: string;
  vip: boolean;
  points: number;
};

/**
 * On signup, create (or link to) a PLAYER row for the new account.
 *  - If a PLAYER with the same email already exists, link to it (don't reset
 *    points or VIP status).
 *  - Otherwise insert a fresh PLAYER with a randomly rolled starting balance,
 *    VIP=FALSE, and a new PID.
 *
 * Wrapped in a single transaction with audit logging so it satisfies the
 * project's "session + transactional write" requirement.
 */
export async function createPlayerForSignup(
  email: string,
): Promise<
  | { ok: true; player: PlayerSnapshot; created: boolean }
  | { ok: false; error: string }
> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.query(
      "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED",
    );
    await conn.beginTransaction();

    const [existing] = await conn.execute<RowDataPacket[]>(
      "SELECT PID, Email, VIP, Points FROM PLAYER WHERE Email = ? FOR UPDATE",
      [email],
    );
    if (existing.length > 0) {
      await conn.commit();
      const row = existing[0];
      return {
        ok: true,
        created: false,
        player: {
          pid: Number(row.PID),
          email: String(row.Email),
          vip: Boolean(Number(row.VIP)),
          points: Number(row.Points),
        },
      };
    }

    const [maxRows] = await conn.execute<RowDataPacket[]>(
      "SELECT COALESCE(MAX(PID), ?) + 1 AS nextPid FROM PLAYER",
      [SIGNUP_PID_BASE],
    );
    const nextPid = Number(maxRows[0]?.nextPid ?? SIGNUP_PID_BASE + 1);
    const startingPoints = rollStartingPoints();

    await conn.execute(
      "INSERT INTO PLAYER (PID, Email, VIP, Points) VALUES (?, ?, FALSE, ?)",
      [nextPid, email, startingPoints],
    );

    const detail = JSON.stringify({
      email,
      startingPoints,
      via: "signup",
    }).slice(0, 500);
    await conn.execute(
      "INSERT INTO audit_log (action, entity, entity_id, detail) VALUES (?, ?, ?, ?)",
      ["CREATE_PLAYER", "PLAYER", nextPid, detail],
    );

    await conn.commit();
    return {
      ok: true,
      created: true,
      player: {
        pid: nextPid,
        email,
        vip: false,
        points: startingPoints,
      },
    };
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    const message = e instanceof Error ? e.message : "Database error";
    return { ok: false, error: message };
  } finally {
    conn.release();
  }
}

/**
 * Record a digital "visit" to a casino. VISITS is keyed on (PID, CID, Date),
 * so INSERT IGNORE means the same (player, casino, day) only counts once.
 * `recorded` indicates whether this call inserted a new row.
 */
export async function recordCasinoVisit(
  pid: number,
  cid: number,
): Promise<{ ok: true; recorded: boolean } | { ok: false; error: string }> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [insertRes] = await conn.execute(
      "INSERT IGNORE INTO VISITS (PID, CID, Date) VALUES (?, ?, CURDATE())",
      [pid, cid],
    );
    const recorded =
      (insertRes as { affectedRows?: number }).affectedRows === 1;

    if (recorded) {
      const detail = JSON.stringify({ pid, cid, via: "play_visit" }).slice(0, 500);
      await conn.execute(
        "INSERT INTO audit_log (action, entity, entity_id, detail) VALUES (?, ?, ?, ?)",
        ["RECORD_VISIT", "CASINO", cid, detail],
      );
    }

    await conn.commit();
    return { ok: true, recorded };
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    const message = e instanceof Error ? e.message : "Database error";
    return { ok: false, error: message };
  } finally {
    conn.release();
  }
}

export async function getPlayerByPid(
  pid: number,
): Promise<{ ok: true; player: PlayerSnapshot | null } | { ok: false; error: string }> {
  try {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT PID, Email, VIP, Points FROM PLAYER WHERE PID = ?",
      [pid],
    );
    if (rows.length === 0) return { ok: true, player: null };
    const row = rows[0];
    return {
      ok: true,
      player: {
        pid: Number(row.PID),
        email: String(row.Email),
        vip: Boolean(Number(row.VIP)),
        points: Number(row.Points),
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { ok: false, error: message };
  }
}

/**
 * Transactional VIP upgrade: locks the player row, verifies they aren't already
 * VIP and have enough Points, then deducts the cost and flips VIP=TRUE. Audit
 * row recorded inside the same transaction.
 */
export async function upgradePlayerToVip(
  pid: number,
): Promise<
  | { ok: true; player: PlayerSnapshot }
  | {
      ok: false;
      error: string;
      reason?: "not_found" | "already_vip" | "insufficient_points";
    }
> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.query(
      "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED",
    );
    await conn.beginTransaction();

    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT PID, Email, VIP, Points FROM PLAYER WHERE PID = ? FOR UPDATE",
      [pid],
    );
    if (rows.length === 0) {
      await conn.rollback();
      return {
        ok: false,
        error: `No player found with PID ${pid}.`,
        reason: "not_found",
      };
    }
    const current = rows[0];
    if (Boolean(Number(current.VIP))) {
      await conn.rollback();
      return {
        ok: false,
        error: "You are already a VIP.",
        reason: "already_vip",
      };
    }
    const oldPoints = Number(current.Points);
    if (oldPoints < VIP_UPGRADE_COST) {
      await conn.rollback();
      return {
        ok: false,
        error: `You need ${VIP_UPGRADE_COST} points to become VIP (you have ${oldPoints}).`,
        reason: "insufficient_points",
      };
    }
    const newPoints = oldPoints - VIP_UPGRADE_COST;

    await conn.execute(
      "UPDATE PLAYER SET Points = ?, VIP = TRUE WHERE PID = ?",
      [newPoints, pid],
    );

    const detail = JSON.stringify({
      cost: VIP_UPGRADE_COST,
      pointsBefore: oldPoints,
      pointsAfter: newPoints,
    }).slice(0, 500);
    await conn.execute(
      "INSERT INTO audit_log (action, entity, entity_id, detail) VALUES (?, ?, ?, ?)",
      ["UPGRADE_PLAYER_VIP", "PLAYER", pid, detail],
    );

    await conn.commit();
    return {
      ok: true,
      player: {
        pid,
        email: String(current.Email),
        vip: true,
        points: newPoints,
      },
    };
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    const message = e instanceof Error ? e.message : "Database update failed";
    return { ok: false, error: message };
  } finally {
    conn.release();
  }
}

export async function updatePlayerPointsWithAudit(
  pid: number,
  newPoints: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    // Per-connection session setting (visible in syllabus as "use Session")
    await conn.query(
      "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED",
    );
    await conn.beginTransaction();

    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT Points FROM PLAYER WHERE PID = ? FOR UPDATE",
      [pid],
    );
    if (rows.length === 0) {
      await conn.rollback();
      return { ok: false, error: `No player found with PID ${pid}.` };
    }
    const oldPoints = Number(rows[0].Points);

    await conn.execute("UPDATE PLAYER SET Points = ? WHERE PID = ?", [
      newPoints,
      pid,
    ]);

    const detail = JSON.stringify({
      from: oldPoints,
      to: newPoints,
    }).slice(0, 500);
    await conn.execute(
      "INSERT INTO audit_log (action, entity, entity_id, detail) VALUES (?, ?, ?, ?)",
      ["UPDATE_PLAYER_POINTS", "PLAYER", pid, detail],
    );

    await conn.commit();
    return { ok: true };
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore rollback errors */
    }
    const message = e instanceof Error ? e.message : "Database update failed";
    return { ok: false, error: message };
  } finally {
    conn.release();
  }
}

export type RouletteBet =
  | { type: "red" | "black"; amount: number }
  | { type: "number"; amount: number; value: number };

export type RouletteSpinResult = {
  pid: number;
  cid: number;
  gameId: number;
  bet: RouletteBet;
  spin: { number: number; color: RouletteColor };
  win: boolean;
  delta: number;
  pointsBefore: number;
  pointsAfter: number;
  firstPlay: boolean;
};

/**
 * Single-transaction roulette spin:
 *   - Lock the PLAYER row (FOR UPDATE), verify balance vs MinBet/MaxBet from
 *     OFFERS for (CID, ROULETTE_GAME_ID).
 *   - Roll a 0..36 winning number using crypto.randomInt.
 *   - Deduct the bet, add winnings on win, UPDATE PLAYER.Points.
 *   - INSERT IGNORE INTO PLAYS so first-time roulette plays are recorded.
 *   - Audit row in audit_log.
 *
 * Payouts: red/black = 1:1, single number = 35:1 (European wheel).
 */
export async function playRouletteAtCasino(
  pid: number,
  cid: number,
  gameId: number,
  bet: RouletteBet,
): Promise<
  | { ok: true; result: RouletteSpinResult }
  | { ok: false; error: string }
> {
  if (!Number.isInteger(bet.amount) || bet.amount < 1) {
    return { ok: false, error: "Bet amount must be a positive integer." };
  }
  if (bet.type === "number") {
    if (!Number.isInteger(bet.value) || bet.value < 0 || bet.value > 36) {
      return { ok: false, error: "Number bets must be between 0 and 36." };
    }
  }

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.query(
      "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED",
    );
    await conn.beginTransaction();

    const [offerRows] = await conn.execute<RowDataPacket[]>(
      `SELECT MinBet, MaxBet
       FROM OFFERS
       WHERE CID = ? AND GameID = ?`,
      [cid, gameId],
    );
    if (offerRows.length === 0) {
      await conn.rollback();
      return {
        ok: false,
        error: "This casino does not offer this game.",
      };
    }
    const minBet = Math.ceil(Number(offerRows[0].MinBet));
    const maxBet = Math.floor(Number(offerRows[0].MaxBet));
    if (bet.amount < minBet || bet.amount > maxBet) {
      await conn.rollback();
      return {
        ok: false,
        error: `Bet must be between ${minBet} and ${maxBet} at this table.`,
      };
    }

    const [playerRows] = await conn.execute<RowDataPacket[]>(
      "SELECT Points FROM PLAYER WHERE PID = ? FOR UPDATE",
      [pid],
    );
    if (playerRows.length === 0) {
      await conn.rollback();
      return { ok: false, error: `No player found with PID ${pid}.` };
    }
    const pointsBefore = Number(playerRows[0].Points);
    if (pointsBefore < bet.amount) {
      await conn.rollback();
      return {
        ok: false,
        error: `You don't have enough points (have ${pointsBefore}, need ${bet.amount}).`,
      };
    }

    const winningNumber = crypto.randomInt(0, 37);
    const winningColor = rouletteColorFor(winningNumber);

    let win = false;
    let delta = -bet.amount;
    if (bet.type === "number") {
      if (winningNumber === bet.value) {
        win = true;
        delta = bet.amount * 35;
      }
    } else if (winningColor === bet.type) {
      win = true;
      delta = bet.amount;
    }

    const pointsAfter = pointsBefore + delta;

    await conn.execute(
      "UPDATE PLAYER SET Points = ? WHERE PID = ?",
      [pointsAfter, pid],
    );

    const [insertRes] = await conn.execute(
      "INSERT IGNORE INTO PLAYS (PID, GameID) VALUES (?, ?)",
      [pid, gameId],
    );
    const firstPlay =
      (insertRes as { affectedRows?: number }).affectedRows === 1;

    const detail = JSON.stringify({
      cid,
      gameId,
      bet,
      spin: { number: winningNumber, color: winningColor },
      win,
      delta,
      pointsBefore,
      pointsAfter,
    }).slice(0, 500);
    await conn.execute(
      "INSERT INTO audit_log (action, entity, entity_id, detail) VALUES (?, ?, ?, ?)",
      ["PLAY_ROULETTE", "PLAYER", pid, detail],
    );

    await conn.commit();
    return {
      ok: true,
      result: {
        pid,
        cid,
        gameId,
        bet,
        spin: { number: winningNumber, color: winningColor },
        win,
        delta,
        pointsBefore,
        pointsAfter,
        firstPlay,
      },
    };
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    const message = e instanceof Error ? e.message : "Database error";
    return { ok: false, error: message };
  } finally {
    conn.release();
  }
}
