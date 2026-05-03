import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { listCasinosFiltered } from "@/lib/queries/casinos";
import { getPlayerByPid } from "@/lib/queries/playerMutations";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Play",
};

export const dynamic = "force-dynamic";

export default async function PlayHomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = getUserBySessionToken(token);
  if (!user) redirect("/signup");

  const [casinosRes, playerRes] = await Promise.all([
    listCasinosFiltered({ sort: "name", order: "asc" }),
    user.playerPid !== null
      ? getPlayerByPid(user.playerPid)
      : Promise.resolve({ ok: true as const, player: null }),
  ]);

  if (!casinosRes.ok) {
    return (
      <div className="mx-auto max-w-2xl flex-1 px-4 py-20 sm:px-6">
        <EmptyState
          title="Could not load casinos"
          description={casinosRes.error}
        />
      </div>
    );
  }

  const balance =
    playerRes.ok && playerRes.player ? playerRes.player.points : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a227]">
              Play
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
              Choose a casino
            </h1>
            <p className="mt-2 text-[#8fa39a]">
              Pick where you&apos;d like to play. Each casino offers a different
              set of games.
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

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {casinosRes.data.map((c) => (
            <Link
              key={c.CID}
              href={`/play/${c.CID}`}
              className="group block"
            >
              <GlowCard className="h-full transition-transform duration-200 group-hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 text-[#e8d48b]">
                    <Building2 className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-white">
                      {c.Name}
                    </h2>
                    <p className="flex items-center gap-1 text-xs text-[#8fa39a]">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {c.Location ?? "Unknown"}
                    </p>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-2 text-xs text-[#8fa39a]">
                  <div className="rounded-lg border border-white/5 bg-[#050807]/60 px-3 py-2">
                    <dt>Capacity</dt>
                    <dd className="mt-1 font-display text-base text-white tabular-nums">
                      {Number(c.Capacity).toLocaleString()}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-[#050807]/60 px-3 py-2">
                    <dt>Floor (sq ft)</dt>
                    <dd className="mt-1 font-display text-base text-white tabular-nums">
                      {Number(c.Size).toLocaleString()}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#c9a227] group-hover:text-[#e8d48b]">
                  See games
                  <ArrowRight className="h-4 w-4" />
                </div>
              </GlowCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
