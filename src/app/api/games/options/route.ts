import { NextResponse } from "next/server";
import {
  distinctGameCategories,
  listAllGameIdName,
} from "@/lib/queries/games";

export async function GET() {
  const [cats, games] = await Promise.all([
    distinctGameCategories(),
    listAllGameIdName(),
  ]);
  if (!cats.ok) {
    return NextResponse.json({ ok: false, error: cats.error }, { status: 500 });
  }
  if (!games.ok) {
    return NextResponse.json({ ok: false, error: games.error }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    categories: cats.data.map((c) => c.Category),
    games: games.data,
  });
}
