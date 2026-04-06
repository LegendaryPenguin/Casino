"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { GlowCard } from "@/components/ui/GlowCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { messageFromApiJson } from "@/lib/api-errors";

type GameRow = {
  GameID: number;
  Name: string;
  Category: string;
  offered_at: string | null;
};

export function GamesExplorer() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOptions = useCallback(async () => {
    const res = await fetch("/api/games/options");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      toast.error(messageFromApiJson(res, data));
      return;
    }
    setCategories(data.categories);
  }, []);

  const loadGames = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    try {
      const res = await fetch(`/api/games?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.error(messageFromApiJson(res, data));
        setGames([]);
        return;
      }
      setGames(data.games);
    } catch {
      toast.error("Network error");
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  return (
    <div className="space-y-8">
      <GlowCard>
        <label className="flex max-w-xs flex-col gap-1 text-xs text-[#8fa39a]">
          Category
          <select
            className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </GlowCard>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-white/5 ring-1 ring-white/10"
            />
          ))}
        </div>
      ) : games.length === 0 ? (
        <EmptyState
          title="No games found"
          description="Seed your database or pick another category."
        />
      ) : (
        <div className="space-y-3">
          {games.map((g) => (
            <div
              key={g.GameID}
              className="rounded-xl border border-white/10 bg-[#0c1210]/80 p-4 transition-colors hover:border-[#c9a227]/30"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-lg text-white">{g.Name}</h3>
                  <span className="mt-1 inline-block rounded-full border border-[#1a5c45]/50 bg-[#0d3d2e]/40 px-2.5 py-0.5 text-xs font-medium text-[#9dccb8]">
                    {g.Category}
                  </span>
                </div>
              </div>
              {g.offered_at ? (
                <p className="mt-3 text-sm leading-relaxed text-[#8fa39a]">
                  <span className="text-[#6b7f76]">Offered at: </span>
                  {g.offered_at}
                </p>
              ) : (
                <p className="mt-3 text-sm text-[#6b7f76]">
                  Not currently offered at any casino.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
