/**
 * MySQL connection pool for Aiven (TLS) and local dev.
 * Uses a global singleton in development to survive Next.js HMR.
 */
import mysql from "mysql2/promise";
import type { PoolOptions } from "mysql2";
import type { RowDataPacket } from "mysql2/promise";
import fs from "fs";

declare global {
  var __casino_mysql_pool: mysql.Pool | undefined;
}

function parseBool(v: string | undefined): boolean {
  return v === "true" || v === "1" || v === "yes";
}

function getSslOptions(): PoolOptions["ssl"] {
  if (!parseBool(process.env.DB_SSL)) {
    return undefined;
  }

  const insecure = parseBool(process.env.DB_SSL_INSECURE);
  let ca: string | undefined;

  if (process.env.DB_CA?.trim()) {
    ca = process.env.DB_CA.replace(/\\n/g, "\n");
  } else if (process.env.DB_CA_BASE64?.trim()) {
    ca = Buffer.from(process.env.DB_CA_BASE64, "base64").toString("utf8");
  } else if (process.env.DB_CA_PATH?.trim()) {
    try {
      ca = fs.readFileSync(process.env.DB_CA_PATH, "utf8");
    } catch {
      console.error("[db] Failed to read DB_CA_PATH");
    }
  }

  if (ca) {
    return { rejectUnauthorized: !insecure, ca };
  }

  if (insecure) {
    return { rejectUnauthorized: false };
  }

  // Aiven typically needs the CA; allow encrypted connection without verify only when explicitly insecure
  console.warn(
    "[db] DB_SSL=true but no DB_CA / DB_CA_BASE64 / DB_CA_PATH — using TLS with rejectUnauthorized: false. Set DB_CA for production.",
  );
  return { rejectUnauthorized: false };
}

export function createPool(): mysql.Pool {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT || "3306");

  if (!host || !user || database === undefined) {
    throw new Error(
      "Missing DB env vars: DB_HOST, DB_USER, DB_NAME are required.",
    );
  }

  return mysql.createPool({
    host,
    port: Number.isFinite(port) ? port : 3306,
    user,
    password: password ?? "",
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: getSslOptions(),
  });
}

export function getPool(): mysql.Pool {
  if (process.env.NODE_ENV !== "production") {
    if (!globalThis.__casino_mysql_pool) {
      globalThis.__casino_mysql_pool = createPool();
    }
    return globalThis.__casino_mysql_pool;
  }
  if (!globalThis.__casino_mysql_pool) {
    globalThis.__casino_mysql_pool = createPool();
  }
  return globalThis.__casino_mysql_pool;
}

export type DbResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Run a query; never interpolate user input into SQL — use placeholders. */
export async function queryRows<T>(
  sqlText: string,
  params?: unknown[],
): Promise<DbResult<T>> {
  try {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      sqlText,
      (params ?? []) as Parameters<typeof pool.execute>[1],
    );
    return { ok: true, data: rows as T };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[db] queryRows error:", message);
    return { ok: false, error: message };
  }
}

/** Ping database (health check). */
export async function pingDb(): Promise<DbResult<true>> {
  try {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.ping();
      return { ok: true, data: true };
    } finally {
      conn.release();
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { ok: false, error: message };
  }
}
