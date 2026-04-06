import { NextRequest, NextResponse } from "next/server";
import { listGamesWithCasinos } from "@/lib/queries/games";
import {
  formatZodError,
  gamesQuerySchema,
  sanitizeSearch,
} from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = gamesQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const category = parsed.data.category
    ? sanitizeSearch(parsed.data.category)
    : undefined;
  const r = await listGamesWithCasinos(category || undefined);
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, games: r.data });
}
