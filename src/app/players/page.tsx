import type { Metadata } from "next";
import { PlayersExplorer } from "@/components/players/PlayersExplorer";

export const metadata: Metadata = {
  title: "Players",
};

export default function PlayersPage() {
  return (
    <div className="mx-auto max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Players
        </h1>
        <p className="mt-2 max-w-2xl text-[#8fa39a]">
          VIP segmentation, points ordering, and email search.
        </p>
      </header>
      <PlayersExplorer />
    </div>
  );
}
