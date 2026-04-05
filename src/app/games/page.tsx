import type { Metadata } from "next";
import { GamesExplorer } from "@/components/games/GamesExplorer";

export const metadata: Metadata = {
  title: "Games",
};

export default function GamesPage() {
  return (
    <div className="mx-auto max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Games
        </h1>
        <p className="mt-2 max-w-2xl text-[#8fa39a]">
          Full catalog with category filters and casinos offering each title.
        </p>
      </header>
      <GamesExplorer />
    </div>
  );
}
