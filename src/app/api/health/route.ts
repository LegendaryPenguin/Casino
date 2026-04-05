import { NextResponse } from "next/server";
import { pingDb } from "@/lib/db";

export async function GET() {
  const r = await pingDb();
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
