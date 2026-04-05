import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f1815] to-[#0a100e] p-5 glow-ring glow-ring-hover transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#8fa39a]">
            {title}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-gradient-gold tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-[#6b7f76]">{hint}</p>
          ) : null}
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#c9a227]/25 bg-[#c9a227]/10 text-[#e8d48b] transition-transform group-hover:scale-105">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </div>
  );
}
