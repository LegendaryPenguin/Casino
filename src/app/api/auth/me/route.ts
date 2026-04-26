import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getPlayerByPid } from "@/lib/queries/playerMutations";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = getUserBySessionToken(token);
  if (!user) {
    return NextResponse.json({ ok: true, user: null, player: null });
  }

  let player = null;
  if (user.playerPid !== null) {
    const r = await getPlayerByPid(user.playerPid);
    if (r.ok) player = r.player;
  }

  return NextResponse.json({ ok: true, user, player });
}
