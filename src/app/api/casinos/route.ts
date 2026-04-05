import { NextRequest, NextResponse } from "next/server";
import { listCasinosFiltered } from "@/lib/queries/casinos";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const minCap = sp.get("minCapacity");
  const minSz = sp.get("minSize");

  const r = await listCasinosFiltered({
    location: sp.get("location") ?? undefined,
    manager: sp.get("manager") ?? undefined,
    minCapacity: minCap != null && minCap !== "" ? Number(minCap) : undefined,
    minSize: minSz != null && minSz !== "" ? Number(minSz) : undefined,
    search: sp.get("search") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    order: sp.get("order") === "desc" ? "desc" : "asc",
  });

  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, casinos: r.data });
}
