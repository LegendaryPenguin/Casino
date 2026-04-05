"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Spade } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/casinos", label: "Casinos" },
  { href: "/games", label: "Games" },
  { href: "/players", label: "Players" },
  { href: "/analytics", label: "Analytics" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050807]/85 backdrop-blur-md">
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2 text-[#e8d48b] transition-colors hover:text-[#f5e6a8]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c9a227]/40 bg-[#0c1210] glow-ring">
            <Spade className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold tracking-wide">
            Casino<span className="text-white/90"> Explorer</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-[#e8d48b]"
                    : "text-[#8fa39a] hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="rounded-lg border border-white/15 p-2 text-white md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[#050807]/98 px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile main">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-[#c9d4ce] hover:bg-white/5"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
