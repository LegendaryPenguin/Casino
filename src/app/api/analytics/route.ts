import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  runAnalytics,
  type AnalyticsQueryId,
} from "@/lib/queries/analytics";

const queryIds: z.ZodType<AnalyticsQueryId> = z.enum([
  "casinos_by_location",
  "vip_players",
  "games_by_casino",
  "casinos_by_game",
  "players_visited_casino",
  "players_above_points",
  "visits_between_dates",
  "casinos_above_capacity",
  "active_tables_casino_game",
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
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { queryId, params } = parsed.data;
  const result = await runAnalytics(queryId, params);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    queryId,
    rows: result.rows,
  });
}
