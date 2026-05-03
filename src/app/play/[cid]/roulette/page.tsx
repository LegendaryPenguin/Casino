import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { RouletteTable } from "@/components/play/RouletteTable";
import { getCasinoGameOffer, ROULETTE_GAME_ID } from "@/lib/queries/play";
import { getPlayerByPid } from "@/lib/queries/playerMutations";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Roulette",
};

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ cid: string }> };

export default async function RoulettePage({ params }: RouteCtx) {
  const { cid: cidRaw } = await params;
  const cid = Math.floor(Number(cidRaw));
  if (!Number.isInteger(cid) || cid < 1) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = getUserBySessionToken(token);
  if (!user) redirect("/signup");
  if (user.playerPid === null) {
    return (
      <div className="mx-auto max-w-2xl flex-1 px-4 py-20 sm:px-6">
        <EmptyState
          title="No player record"
          description="Your account isn't linked to a PLAYER row yet."
        />
      </div>
    );
  }

  const [offerRes, playerRes] = await Promise.all([
    getCasinoGameOffer(cid, ROULETTE_GAME_ID),
    getPlayerByPid(user.playerPid),
  ]);

  if (!offerRes.ok) {
    return (
      <div className="mx-auto max-w-2xl flex-1 px-4 py-20 sm:px-6">
        <EmptyState
          title="Could not load this table"
          description={offerRes.error}
        />
      </div>
    );
  }
  if (offerRes.data.length === 0) {
    return (
      <div className="mx-auto max-w-2xl flex-1 px-4 py-20 sm:px-6">
        <Link
          href={`/play/${cid}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-[#8fa39a] hover:text-[#c9a227]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <EmptyState
          title="Roulette isn't offered here"
          description="This casino doesn't have a roulette table. Pick another casino."
        />
      </div>
    );
  }

  const offer = offerRes.data[0];
  const player =
    playerRes.ok && playerRes.player ? playerRes.player : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full">
        <Link
          href={`/play/${cid}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-[#8fa39a] hover:text-[#c9a227]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {offer.CasinoName}
        </Link>

        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a227]">
              {offer.CasinoName} · {offer.Location}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
              Roulette
            </h1>
            <p className="mt-2 text-[#8fa39a]">
              European single-zero. Red/Black pays 1:1, single number pays 35:1.
            </p>
          </div>
          {player ? (
            <div className="rounded-xl border border-white/10 bg-[#050807]/70 px-4 py-2 text-right">
              <p className="text-xs uppercase tracking-wide text-[#8fa39a]">
                Your balance
              </p>
              <p className="font-display text-lg font-semibold text-[#e8d48b]">
                {player.points.toLocaleString()} pts
              </p>
            </div>
          ) : null}
        </header>

        <RouletteTable
          cid={cid}
          casinoName={offer.CasinoName}
          minBet={Math.ceil(Number(offer.MinBet))}
          maxBet={Math.floor(Number(offer.MaxBet))}
          activeTables={Number(offer.ActiveTables)}
          initialBalance={player?.points ?? 0}
        />
      </div>
    </div>
  );
}
