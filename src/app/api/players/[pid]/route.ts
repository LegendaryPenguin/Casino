import { NextRequest, NextResponse } from "next/server";
import { updatePlayerPointsWithAudit } from "@/lib/queries/playerMutations";
import {
  formatZodError,
  patchPlayerPointsBodySchema,
} from "@/lib/validation/schemas";

type RouteCtx = { params: Promise<{ pid: string }> };

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { pid: pidRaw } = await ctx.params;
  const pid = Math.floor(Number(pidRaw));
  if (!Number.isInteger(pid) || pid < 1 || pid > 2_147_483_647) {
    return NextResponse.json(
      { ok: false, error: "Player id must be a positive integer." },
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

  const parsed = patchPlayerPointsBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const result = await updatePlayerPointsWithAudit(pid, parsed.data.points);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, pid, points: parsed.data.points });
}
