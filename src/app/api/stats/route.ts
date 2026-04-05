import { NextResponse } from "next/server";
import { getAggregateStats, getVisitsByMonth } from "@/lib/queries/stats";

export async function GET() {
  const [agg, months] = await Promise.all([
    getAggregateStats(),
    getVisitsByMonth(8),
  ]);

  if (!agg.ok) {
    return NextResponse.json({ ok: false, error: agg.error }, { status: 500 });
  }
  if (!months.ok) {
    return NextResponse.json(
      { ok: false, error: months.error },
      { status: 500 },
    );
  }

  const chart = [...months.data].reverse().map((m) => ({
    label: m.ym,
    visits: Number(m.cnt),
  }));

  return NextResponse.json({
    ok: true,
    stats: agg.data,
    chart,
  });
}
