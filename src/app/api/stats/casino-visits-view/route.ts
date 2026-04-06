import { NextResponse } from "next/server";
import { getCasinoVisitSummaryFromView } from "@/lib/queries/reports";

export async function GET() {
  const r = await getCasinoVisitSummaryFromView();
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, rows: r.data });
}
