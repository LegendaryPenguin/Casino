import { NextRequest, NextResponse } from "next/server";
import { listPlayersFiltered } from "@/lib/queries/players";
import {
  formatZodError,
  playersQuerySchema,
  sanitizeSearch,
} from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = playersQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const vip = parsed.data.vip;
  const vipOnly = vip === "1" || vip === "true";

  const r = await listPlayersFiltered({
    vipOnly,
    sortPoints: parsed.data.sortPoints,
    emailSearch: parsed.data.search
      ? sanitizeSearch(parsed.data.search)
      : undefined,
  });
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, players: r.data });
}
