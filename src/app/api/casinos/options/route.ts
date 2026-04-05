import { NextResponse } from "next/server";
import {
  distinctCasinoLocations,
  distinctCasinoManagers,
  listAllCasinoIdName,
} from "@/lib/queries/casinos";

export async function GET() {
  const [loc, mgr, list] = await Promise.all([
    distinctCasinoLocations(),
    distinctCasinoManagers(),
    listAllCasinoIdName(),
  ]);

  if (!loc.ok) {
    return NextResponse.json({ ok: false, error: loc.error }, { status: 500 });
  }
  if (!mgr.ok) {
    return NextResponse.json({ ok: false, error: mgr.error }, { status: 500 });
  }
  if (!list.ok) {
    return NextResponse.json({ ok: false, error: list.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    locations: loc.data.map((x) => x.Location),
    managers: mgr.data.map((x) => x.Manager),
    casinos: list.data,
  });
}
