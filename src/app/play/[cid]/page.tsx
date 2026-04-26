import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft, ArrowRight, Check, Dice5 } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { listCasinosFiltered } from "@/lib/queries/casinos";
import { listGamesAtCasino, ROULETTE_GAME_ID } from "@/lib/queries/play";
import { getPlayerByPid, recordCasinoVisit } from "@/lib/queries/playerMutations";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Choose a game",
};

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ cid: string }> };

export default async function CasinoGamesPage({ params }: RouteCtx) {
  const { cid: cidRaw } = await params;
  const cid = Math.floor(Number(cidRaw));
  if (!Number.isInteger(cid) || cid < 1) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = getUserBySessionToken(token);
  if (!user) redirect("/signup");

  const [allCasinosRes, gamesRes, playerRes] = await Promise.all([
    listCasinosFiltered({ sort: "name", order: "asc" }),
    listGamesAtCasino(cid),
    user.playerPid !== null
      ? getPlayerByPid(user.playerPid)
      : Promise.resolve({ ok: true as const, player: null }),
  ]);

  const casino =
    allCasinosRes.ok
      ? allCasinosRes.data.find((c) => Number(c.CID) === cid)
      : undefined;
  if (!casino) notFound();

  if (!gamesRes.ok) {
    return (
      <div className="mx-auto max-w-2xl flex-1 px-4 py-20 sm:px-6">
        <EmptyState
          title="Could not load games"
          description={gamesRes.error}
        />
      </div>
    );
  }

  // Record the digital visit. Idempotent per (PID, CID, today) thanks to the
  // VISITS primary key + INSERT IGNORE.
  let visitRecordedToday = false;
  if (user.playerPid !== null) {
    const r = await recordCasinoVisit(user.playerPid, cid);
    if (r.ok) visitRecordedToday = r.recorded;
  }

  const balance =
    playerRes.ok && playerRes.player ? playerRes.player.points : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full">
        <Link
          href="/play"
          className="mb-6 inline-flex items-center gap-1 text-sm text-[#8fa39a] hover:text-[#c9a227]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to casinos
        </Link>

        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a227]">
              {casino.Location}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
              {casino.Name}
            </h1>
            <p className="mt-2 text-[#8fa39a]">
              Games offered here. Pick one to take a seat.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
              <Check className="h-3 w-3" aria-hidden />
              {visitRecordedToday
                ? "Visit recorded in VISITS"
                : "Visit already on file for today"}
            </p>
          </div>
          {balance !== null ? (
            <div className="rounded-xl border border-white/10 bg-[#050807]/70 px-4 py-2 text-right">
              <p className="text-xs uppercase tracking-wide text-[#8fa39a]">
                Your balance
              </p>
              <p className="font-display text-lg font-semibold text-[#e8d48b]">
                {balance.toLocaleString()} pts
              </p>
            </div>
          ) : null}
        </header>

        {gamesRes.data.length === 0 ? (
          <EmptyState
            title="No games here"
            description="This casino doesn't have any games configured."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {gamesRes.data.map((g) => {
              const playable = Number(g.GameID) === ROULETTE_GAME_ID;
              const min = Math.ceil(Number(g.MinBet));
              const max = Math.floor(Number(g.MaxBet));
              const inner = (
                <GlowCard
                  className={`h-full transition-transform duration-200 ${
                    playable ? "group-hover:-translate-y-0.5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 text-[#e8d48b]">
                      <Dice5 className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-white">
                        {g.GameName}
                      </h2>
                      <p className="text-xs text-[#8fa39a]">{g.Category}</p>
                    </div>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-2 text-xs text-[#8fa39a]">
                    <div className="rounded-lg border border-white/5 bg-[#050807]/60 px-3 py-2">
                      <dt>Min bet</dt>
                      <dd className="mt-1 font-display text-base text-white tabular-nums">
                        {min} pts
                      </dd>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-[#050807]/60 px-3 py-2">
                      <dt>Max bet</dt>
                      <dd className="mt-1 font-display text-base text-white tabular-nums">
                        {max} pts
                      </dd>
                    </div>
                    <div className="col-span-2 rounded-lg border border-white/5 bg-[#050807]/60 px-3 py-2">
                      <dt>Active tables</dt>
                      <dd className="mt-1 font-display text-base text-white tabular-nums">
                        {Number(g.ActiveTables)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-5">
                    {playable ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-[#c9a227] group-hover:text-[#e8d48b]">
                        Take a seat
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-wide text-[#8fa39a]">
                        Coming soon
                      </span>
                    )}
                  </div>
                </GlowCard>
              );

              return playable ? (
                <Link
                  key={g.GameID}
                  href={`/play/${cid}/roulette`}
                  className="group block"
                >
                  {inner}
                </Link>
              ) : (
                <div key={g.GameID} className="opacity-70">
                  {inner}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
