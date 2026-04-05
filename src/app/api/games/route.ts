import { NextRequest, NextResponse } from "next/server";
import { listGamesWithCasinos } from "@/lib/queries/games";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") ?? undefined;
  const r = await listGamesWithCasinos(category || undefined);
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, games: r.data });
}
