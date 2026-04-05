import type { Metadata } from "next";
import { AnalyticsExplorer } from "@/components/analytics/AnalyticsExplorer";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Analytics &amp; queries
        </h1>
        <p className="mt-2 max-w-2xl text-[#8fa39a]">
          Parameterized SQL behind each widget — results render as tables below.
        </p>
      </header>
      <AnalyticsExplorer />
    </div>
  );
}
