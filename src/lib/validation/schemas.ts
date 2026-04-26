/**
 * Zod schemas for API query/body validation — limits size, type, and range
 * before any SQL runs. Pair with parameterized queries only.
 */
import { z } from "zod";
import type { AnalyticsQueryId } from "@/lib/queries/analytics";

export const MAX_TEXT = 200;
export const MAX_NAME = 100;
export const MAX_INT = 2_147_483_647;
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const emptyToUndef = (s: unknown) =>
  s === "" || s === null || s === undefined ? undefined : s;

/** Strip control characters (except tab/newline) from free text */
export function sanitizeSearch(s: string): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, MAX_TEXT);
}

const optionalNonNegInt = z.preprocess((v) => {
  const u = emptyToUndef(v);
  if (u === undefined) return undefined;
  const n = Number(u);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return NaN;
  return n;
}, z.number().int().min(0).max(MAX_INT).optional());

export const casinosQuerySchema = z.object({
  location: z.preprocess(
    emptyToUndef,
    z.string().max(MAX_NAME).optional(),
  ),
  manager: z.preprocess(
    emptyToUndef,
    z.string().max(MAX_NAME).optional(),
  ),
  minCapacity: optionalNonNegInt,
  minSize: optionalNonNegInt,
  search: z.preprocess(emptyToUndef, z.string().max(MAX_TEXT).optional()),
  sort: z.enum(["name", "capacity", "size", "location"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const playersQuerySchema = z.object({
  vip: z.string().optional(),
  sortPoints: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.preprocess(emptyToUndef, z.string().max(MAX_TEXT).optional()),
});

export const gamesQuerySchema = z.object({
  category: z.preprocess(
    emptyToUndef,
    z.string().max(50).optional(),
  ),
});

const posInt = z.preprocess((v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return NaN;
  return n;
}, z.number().int().min(1).max(MAX_INT));

export const patchPlayerPointsBodySchema = z.object({
  points: z.coerce.number().int().min(0).max(10_000_000),
});

export const createAccountBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(MAX_NAME),
  email: z.string().trim().email("Use a valid email").max(MAX_NAME),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer"),
});

const analyticsLocation = z.object({
  location: z.string().min(1).max(MAX_NAME),
});
const analyticsCid = z.object({ cid: posInt });
const analyticsGameId = z.object({ gameId: posInt });
const analyticsCidGame = z.object({ cid: posInt, gameId: posInt });
const analyticsMinPoints = z.object({
  minPoints: z.preprocess((v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return NaN;
    return n;
  }, z.number().int().min(0).max(MAX_INT)),
});
const analyticsDates = z
  .object({
    startDate: z.string().regex(ISO_DATE, "Use YYYY-MM-DD"),
    endDate: z.string().regex(ISO_DATE, "Use YYYY-MM-DD"),
  })
  .refine((d) => d.startDate <= d.endDate, {
    message: "startDate must be on or before endDate",
  });
const analyticsMinCap = z.object({
  minCapacity: z.preprocess((v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return NaN;
    return n;
  }, z.number().int().min(0).max(MAX_INT)),
});
const analyticsTopLimit = z
  .object({ limit: z.union([z.number(), z.string()]).optional() })
  .superRefine((val, ctx) => {
    const v = val.limit;
    if (v === undefined || v === null || v === "") return;
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "limit must be an integer from 1 to 1000, or omitted to return all players",
        path: ["limit"],
      });
    }
  })
  .transform((val) => {
    const v = val.limit;
    if (v === undefined || v === null || v === "") return {};
    const n = typeof v === "number" ? v : Number(v);
    return { limit: n };
  });
const analyticsEmpty = z.object({});

const analyticsParamParsers: Record<
  AnalyticsQueryId,
  z.ZodType<Record<string, unknown>>
> = {
  casinos_by_location: analyticsLocation,
  vip_players: analyticsEmpty,
  games_by_casino: analyticsCid,
  casinos_by_game: analyticsGameId,
  players_visited_casino: analyticsCid,
  players_above_points: analyticsMinPoints,
  visits_between_dates: analyticsDates,
  casinos_above_capacity: analyticsMinCap,
  active_tables_casino_game: analyticsCidGame,
  card_games: analyticsEmpty,
  table_games: analyticsEmpty,
  most_visited_casino: analyticsEmpty,
  top_players_by_points: analyticsTopLimit,
};

export function parseAnalyticsParams(
  queryId: AnalyticsQueryId,
  params: unknown,
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const schema = analyticsParamParsers[queryId];
  const raw =
    params && typeof params === "object" && !Array.isArray(params)
      ? params
      : {};
  const r = schema.safeParse(raw);
  if (!r.success) {
    const msg = r.error.issues.map((i) => i.message).join("; ");
    return { ok: false, error: msg || "Invalid parameters for this query" };
  }
  return { ok: true, data: r.data as Record<string, unknown> };
}

export function formatZodError(err: z.ZodError): string {
  const issues = err.issues.map((i) => {
    const path = i.path.length ? `${i.path.join(".")}: ` : "";
    return `${path}${i.message}`;
  });
  return issues.length ? issues.join("; ") : "Invalid input";
}
