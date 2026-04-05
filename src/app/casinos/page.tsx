import type { Metadata } from "next";
import { CasinosExplorer } from "@/components/casinos/CasinosExplorer";

export const metadata: Metadata = {
  title: "Casinos",
};

export default function CasinosPage() {
  return (
    <div className="mx-auto max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Casinos
        </h1>
        <p className="mt-2 max-w-2xl text-[#8fa39a]">
          Filter by location, manager, capacity, and footprint — search and sort in
          real time.
        </p>
      </header>
      <CasinosExplorer />
    </div>
  );
}
