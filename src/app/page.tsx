import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Dice5,
  Footprints,
  Sparkles,
  Users,
} from "lucide-react";
import { getAggregateStats, getFeaturedCasinos, getVisitsByMonth } from "@/lib/queries/stats";
import { VisitsBarChart } from "@/components/charts/VisitsBarChart";
import { StatCard } from "@/components/ui/StatCard";
import { GlowCard } from "@/components/ui/GlowCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

const dbEnvHint =
  process.env.VERCEL === "1"
    ? "Check Vercel Environment Variables: DB_HOST must match Aiven’s current host (ENOTFOUND means the hostname is wrong or the service was recreated). Redeploy after updating."
    : "Check .env.local and Aiven connectivity.";

export default async function Home() {
  const [agg, featured, months] = await Promise.all([
    getAggregateStats(),
    getFeaturedCasinos(),
    getVisitsByMonth(),
  ]);

  if (!agg.ok) {
    return (
      <div className="mx-auto max-w-2xl flex-1 px-4 py-20 sm:px-6">
        <EmptyState
          title="Database unavailable"
          description={`${dbEnvHint} ${agg.error}`}
        />
      </div>
    );
  }
  if (!featured.ok) {
    return (
      <div className="mx-auto max-w-2xl flex-1 px-4 py-20 sm:px-6">
        <EmptyState
          title="Database unavailable"
          description={`${dbEnvHint} ${featured.error}`}
        />
      </div>
    );
  }
  if (!months.ok) {
    return (
      <div className="mx-auto max-w-2xl flex-1 px-4 py-20 sm:px-6">
        <EmptyState
          title="Database unavailable"
          description={`${dbEnvHint} ${months.error}`}
        />
      </div>
    );
  }

  const chart = months.data.map((m) => ({
    label: m.ym,
    visits: Number(m.cnt),
  }));

  return (
    <div className="flex-1">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(201,162,39,0.12),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a227]">
            Intelligence suite
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Curated insight across{" "}
            <span className="text-gradient-gold">venues, players, and play</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[#8fa39a]">
            All figures on this page are computed from your MySQL tables (CASINO,
            PLAYER, GAMES, VISITS) on each request — no static demo numbers.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/casinos"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a227] to-[#a68419] px-6 py-3 text-sm font-semibold text-[#0a0f0d] shadow-lg shadow-[#c9a227]/20 transition-transform hover:scale-[1.02]"
            >
              Explore casinos
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[#c9a227]/40 hover:text-[#e8d48b]"
            >
              <Sparkles className="h-4 w-4 text-[#c9a227]" />
              Run analytics
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <h2 className="font-display text-xl text-[#e8d48b]">At a glance</h2>
          <p className="mt-1 text-sm text-[#8fa39a]">
            Each number is <code className="text-[#c9a227]">COUNT(*)</code> on the
            named table
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Casinos"
              value={agg.data.casinos}
              icon={Building2}
              hint="Table: CASINO"
            />
            <StatCard
              title="Players"
              value={agg.data.players}
              icon={Users}
              hint="Table: PLAYER"
            />
            <StatCard
              title="Games"
              value={agg.data.games}
              icon={Dice5}
              hint="Table: GAMES"
            />
            <StatCard
              title="Visits"
              value={agg.data.visits}
              icon={Footprints}
              hint="Table: VISITS"
            />
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <GlowCard>
            <h3 className="font-display text-lg text-[#e8d48b]">
              Visits by month
            </h3>
            <p className="mt-1 text-sm text-[#8fa39a]">
              Grouped by month from every row in VISITS
            </p>
            <div className="mt-6">
              {chart.length === 0 ? (
                <p className="text-sm text-[#6b7f76]">No visit rows yet.</p>
              ) : (
                <VisitsBarChart data={chart} />
              )}
            </div>
          </GlowCard>

          <GlowCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg text-[#e8d48b]">
                  Featured casinos
                </h3>
                <p className="mt-1 text-sm text-[#8fa39a]">
                  Ranked by visits, then capacity
                </p>
              </div>
              <Link
                href="/casinos"
                className="shrink-0 text-sm font-medium text-[#c9a227] hover:text-[#e8d48b]"
              >
                View all
              </Link>
            </div>
            <ul className="mt-6 space-y-4">
              {featured.data.map((c) => (
                <li
                  key={c.CID}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#050807]/60 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{c.Name}</p>
                    <p className="text-xs text-[#8fa39a]">{c.Location}</p>
                  </div>
                  <span className="text-xs tabular-nums text-[#c9a227]">
                    {Number(c.visit_count)} visits
                  </span>
                </li>
              ))}
            </ul>
          </GlowCard>
        </section>
      </div>
    </div>
  );
}
