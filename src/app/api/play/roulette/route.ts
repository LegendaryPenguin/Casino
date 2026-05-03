import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import {
  playRouletteAtCasino,
  type RouletteBet,
} from "@/lib/queries/playerMutations";
import { ROULETTE_GAME_ID } from "@/lib/queries/play";
import {
  formatZodError,
  rouletteBetSchema,
} from "@/lib/validation/schemas";

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const parsed = rouletteBetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const { cid, bet, betType, betValue } = parsed.data;
  const rouletteBet: RouletteBet =
    betType === "number"
      ? { type: "number", amount: bet, value: betValue as number }
      : { type: betType, amount: bet };

  const result = await playRouletteAtCasino(
    user.playerPid,
    cid,
    ROULETTE_GAME_ID,
    rouletteBet,
  );
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, result: result.result });
}
