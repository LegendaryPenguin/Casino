import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { SignupForm } from "@/components/auth/SignupForm";
import { GlowCard } from "@/components/ui/GlowCard";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create Account",
};

export default async function SignupPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = getUserBySessionToken(token);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full">
        <header className="mx-auto mb-10 max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a227]">
            Account access
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
            Join Casino, Inc.
          </h1>
          <p className="mt-2 text-[#8fa39a]">
            Create a new account and start a signed-in session.
          </p>
        </header>

        {user ? (
          <GlowCard className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-2xl font-semibold text-white">
              You&apos;re already signed in
            </h2>
            <p className="mt-2 text-sm text-[#8fa39a]">
              Signed in as{" "}
              <span className="text-[#e8d48b]">{user.name}</span> ({user.email}).
            </p>
            <Link
              href="/account"
              className="mt-5 inline-flex rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/15 px-4 py-2 text-sm font-semibold text-[#e8d48b] hover:bg-[#c9a227]/25"
            >
              Go to my account
            </Link>
          </GlowCard>
        ) : (
          <SignupForm />
        )}
      </div>
    </div>
  );
}
