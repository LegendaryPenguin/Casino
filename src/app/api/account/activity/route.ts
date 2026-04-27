import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { listPlayerActivity } from "@/lib/queries/accountActivity";
import {
  accountActivityQuerySchema,
  formatZodError,
} from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = getUserBySessionToken(token);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in." },
      { status: 401 },
    );
  }
  if (user.playerPid === null) {
    return NextResponse.json(
      { ok: false, error: "Your account is not linked to a player record." },
      { status: 400 },
    );
  }

  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = accountActivityQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const r = await listPlayerActivity(user.playerPid, {
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    cid: parsed.data.cid,
  });
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, rows: r.data });
}
