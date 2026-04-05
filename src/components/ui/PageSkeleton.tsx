import { GlowCard } from "./GlowCard";

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-10 w-64 rounded-lg bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-white/5 ring-1 ring-white/10"
          />
        ))}
      </div>
      <GlowCard>
        <div className="h-48 rounded-xl bg-white/5" />
      </GlowCard>
    </div>
  );
}
