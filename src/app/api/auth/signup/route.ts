import { NextRequest, NextResponse } from "next/server";
import {
  createAccount,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  setUserPlayerPid,
} from "@/lib/auth";
import { createPlayerForSignup } from "@/lib/queries/playerMutations";
import {
  createAccountBodySchema,
  formatZodError,
} from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const parsed = createAccountBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const { name, email } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  // Roll a starting balance / link to an existing PLAYER row before we commit
  // any in-memory account, so a DB outage doesn't leave us with an orphan.
  const playerResult = await createPlayerForSignup(normalizedEmail);
  if (!playerResult.ok) {
    return NextResponse.json(
      { ok: false, error: playerResult.error },
      { status: 500 },
    );
  }

  const accountResult = createAccount({
    name,
    email,
    playerPid: playerResult.player.pid,
  });
  if (!accountResult.ok) {
    return NextResponse.json(
      { ok: false, error: accountResult.error },
      { status: 400 },
    );
  }

  const { user, sessionToken, sessionExpiresAt } = accountResult.account;
  setUserPlayerPid(user.id, playerResult.player.pid);

  const res = NextResponse.json({
    ok: true,
    user: { ...user, playerPid: playerResult.player.pid },
    player: playerResult.player,
    createdPlayer: playerResult.created,
  });
  res.cookies.set(
    SESSION_COOKIE_NAME,
    sessionToken,
    sessionCookieOptions(sessionExpiresAt),
  );
  return res;
}
