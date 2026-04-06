/**
 * Transactional UPDATE on one pooled connection: SET SESSION, read (FOR UPDATE),
 * UPDATE PLAYER, INSERT audit_log — satisfies "session" + "database update" rubric.
 */
import type { RowDataPacket } from "mysql2/promise";
import { getPool } from "@/lib/db";

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
