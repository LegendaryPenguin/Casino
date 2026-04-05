/**
 * One-off import: runs sql/CasinoInc.sql against the DB from .env.local.
 * Usage: node --env-file=.env.local scripts/import-sql.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, "..", "sql", "CasinoInc.sql");

const host = process.env.DB_HOST;
const port = Number(process.env.DB_PORT || "3306");
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD ?? "";
const database = process.env.DB_NAME;

if (!host || !user || !database) {
  console.error("Missing DB_HOST, DB_USER, or DB_NAME in environment.");
  process.exit(1);
}

let ssl;
if (process.env.DB_SSL === "true" || process.env.DB_SSL === "1") {
  let ca = process.env.DB_CA?.replace(/\\n/g, "\n");
  if (process.env.DB_CA_BASE64?.trim()) {
    ca = Buffer.from(process.env.DB_CA_BASE64, "base64").toString("utf8");
  }
  const insecure =
    process.env.DB_SSL_INSECURE === "true" ||
    process.env.DB_SSL_INSECURE === "1";
  if (ca) {
    ssl = { ca, rejectUnauthorized: !insecure };
  } else {
    ssl = { rejectUnauthorized: insecure ? false : false };
  }
}

const sql = fs.readFileSync(sqlPath, "utf8");

const conn = await mysql.createConnection({
  host,
  port,
  user,
  password,
  database,
  ssl,
  multipleStatements: true,
});

try {
  await conn.query(sql);
  console.log("OK: sql/CasinoInc.sql applied successfully.");
} finally {
  await conn.end();
}
