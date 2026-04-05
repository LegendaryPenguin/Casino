import type { ReactNode } from "react";

export function GlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#c9a227]/20 bg-[#0c1210]/90 p-5 glow-ring glow-ring-hover transition-shadow duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
