import { NextRequest, NextResponse } from "next/server";
import { listPlayersFiltered } from "@/lib/queries/players";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const r = await listPlayersFiltered({
    vipOnly: sp.get("vip") === "1" || sp.get("vip") === "true",
    sortPoints: sp.get("sortPoints") === "asc" ? "asc" : "desc",
    emailSearch: sp.get("search") ?? undefined,
  });
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, players: r.data });
}
