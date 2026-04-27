import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  runAnalytics,
  type AnalyticsQueryId,
} from "@/lib/queries/analytics";
import { formatZodError, parseAnalyticsParams } from "@/lib/validation/schemas";

const queryIds: z.ZodType<AnalyticsQueryId> = z.enum([
  "casinos_by_location",
  "vip_players",
  "games_by_casino",
  "casinos_by_game",
  "players_visited_casino",
  "players_played_at_casino",
  "visits_between_dates",
  "casinos_above_capacity",
  "players_by_visits",
  "card_games",
  "table_games",
  "most_visited_casino",
  "top_players_by_points",
]);

const bodySchema = z.object({
  queryId: queryIds,
  params: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const { queryId, params } = parsed.data;
  const paramCheck = parseAnalyticsParams(queryId, params);
  if (!paramCheck.ok) {
    return NextResponse.json(
      { ok: false, error: paramCheck.error },
      { status: 400 },
    );
  }

  const result = await runAnalytics(queryId, paramCheck.data);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    queryId,
    rows: result.rows,
  });
}
