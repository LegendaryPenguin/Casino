import { NextResponse } from "next/server";
import { getDashboardFormDefaults } from "@/lib/queries/dashboardDefaults";

export async function GET() {
  const r = await getDashboardFormDefaults();
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ...r.data });
}
