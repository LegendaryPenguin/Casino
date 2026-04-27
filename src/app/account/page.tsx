import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Crown, Gem, Mail, Sparkles, Hash } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { BecomeVipButton } from "@/components/account/BecomeVipButton";
import { MyActivity } from "@/components/account/MyActivity";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import {
  getPlayerByPid,
  VIP_COST_POINTS,
} from "@/lib/queries/playerMutations";

export const metadata: Metadata = {
  title: "My Account",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = getUserBySessionToken(token);

  if (!user) {
    redirect("/signup");
  }

  let playerError: string | null = null;
  let player = null;
  if (user.playerPid !== null) {
    const r = await getPlayerByPid(user.playerPid);
    if (!r.ok) {
      playerError = r.error;
    } else {
      player = r.player;
    }
  }

  const canUpgrade =
    player !== null && !player.vip && player.points >= VIP_COST_POINTS;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a227]">
            Account
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
            Welcome back, {user.name}
          </h1>
          <p className="mt-2 text-[#8fa39a]">
            Signed in as {user.email}.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <GlowCard>
            <h2 className="font-display text-lg text-[#e8d48b]">Profile</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Field icon={<Mail className="h-4 w-4" />} label="Email">
                {user.email}
              </Field>
              <Field icon={<Hash className="h-4 w-4" />} label="Player ID">
                {player ? `#${player.pid}` : "—"}
              </Field>
              <Field icon={<Crown className="h-4 w-4" />} label="Status">
                {player?.vip ? (
                  <span className="rounded-full border border-[#c9a227]/40 bg-[#c9a227]/15 px-2 py-0.5 text-xs font-semibold text-[#e8d48b]">
                    VIP
                  </span>
                ) : (
                  <span className="text-[#c9d4ce]">Standard</span>
                )}
              </Field>
              <Field icon={<Gem className="h-4 w-4" />} label="Points">
                <span className="font-display text-lg font-semibold tabular-nums text-white">
                  {player ? player.points.toLocaleString() : "—"}
                </span>
              </Field>
            </dl>
            <p className="mt-4 text-xs text-[#6b7f76]">
              Your row also appears on the public{" "}
              <Link href="/players" className="text-[#c9a227] hover:underline">
                /players
              </Link>{" "}
              roster.
            </p>
          </GlowCard>

          <GlowCard>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 text-[#e8d48b]">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="font-display text-lg text-[#e8d48b]">
                VIP membership
              </h2>
            </div>
            <p className="mt-3 text-sm text-[#8fa39a]">
              Spend{" "}
              <span className="font-semibold text-[#c9a227]">
                {VIP_COST_POINTS} points
              </span>{" "}
              to upgrade to VIP. Runs in a single DB transaction with row lock,
              points deduction, and an{" "}
              <code className="text-[#c9a227]">audit_log</code> entry.
            </p>

            <div className="mt-5">
              {playerError ? (
                <p className="text-sm text-red-300">{playerError}</p>
              ) : player === null ? (
                <p className="text-sm text-[#8fa39a]">
                  No player record linked to this account.
                </p>
              ) : player.vip ? (
                <p className="text-sm text-[#e8d48b]">
                  You&apos;re already a VIP — enjoy the perks.
                </p>
              ) : canUpgrade ? (
                <BecomeVipButton cost={VIP_COST_POINTS} />
              ) : (
                <div className="space-y-2">
                  <BecomeVipButton cost={VIP_COST_POINTS} disabled />
                  <p className="text-xs text-[#8fa39a]">
                    You need at least {VIP_COST_POINTS} points (you have{" "}
                    {player.points.toLocaleString()}).
                  </p>
                </div>
              )}
            </div>
          </GlowCard>
        </div>

        {player !== null ? (
          <section className="mt-10">
            <MyActivity />
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
      <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#8fa39a]">
        <span className="text-[#c9a227]">{icon}</span>
        {label}
      </dt>
      <dd className="text-right text-[#c9d4ce]">{children}</dd>
    </div>
  );
}
