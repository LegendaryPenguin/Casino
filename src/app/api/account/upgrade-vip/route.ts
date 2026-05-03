import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { upgradePlayerToVip } from "@/lib/queries/playerMutations";

export async function POST(req: NextRequest) {
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

  const result = await upgradePlayerToVip(user.playerPid);
  if (!result.ok) {
    const status =
      result.reason === "already_vip" || result.reason === "insufficient_points"
        ? 400
        : result.reason === "not_found"
          ? 404
          : 500;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, player: result.player });
}
