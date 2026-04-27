export const dynamic = "force-dynamic";

export default function Home() {
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
            Analyzing and reporting on casino performance, player behavior, and game trends to help casinos make data-informed decisions. Simulate playing a game and see how it affects your points!
          </p>
        </div>
      </section>
    </div>
  );
}
