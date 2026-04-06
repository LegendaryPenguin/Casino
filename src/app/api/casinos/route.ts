import { NextRequest, NextResponse } from "next/server";
import { listCasinosFiltered } from "@/lib/queries/casinos";
import {
  casinosQuerySchema,
  formatZodError,
  sanitizeSearch,
} from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = casinosQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const { search, ...rest } = parsed.data;
  const r = await listCasinosFiltered({
    ...rest,
    search: search ? sanitizeSearch(search) : undefined,
  });

  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, casinos: r.data });
}
