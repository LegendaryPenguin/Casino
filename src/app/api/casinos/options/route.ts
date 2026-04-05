import { NextResponse } from "next/server";
import {
  casinoCapacityRange,
  casinoSizeRange,
  distinctCasinoLocations,
  distinctCasinoManagers,
  listAllCasinoIdName,
} from "@/lib/queries/casinos";

export async function GET() {
  const [loc, mgr, list, cap, sz] = await Promise.all([
    distinctCasinoLocations(),
    distinctCasinoManagers(),
    listAllCasinoIdName(),
    casinoCapacityRange(),
    casinoSizeRange(),
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
  if (!cap.ok) {
    return NextResponse.json({ ok: false, error: cap.error }, { status: 500 });
  }
  if (!sz.ok) {
    return NextResponse.json({ ok: false, error: sz.error }, { status: 500 });
  }

  const cr = cap.data[0];
  const sr = sz.data[0];
  return NextResponse.json({
    ok: true,
    locations: loc.data.map((x) => x.Location),
    managers: mgr.data.map((x) => x.Manager),
    casinos: list.data,
    capacityRange: {
      min: Number(cr.min_cap),
      max: Number(cr.max_cap),
    },
    sizeRange: {
      min: Number(sr.min_sz),
      max: Number(sr.max_sz),
    },
  });
}
