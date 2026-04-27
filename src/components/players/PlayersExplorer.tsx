"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { messageFromApiJson } from "@/lib/api-errors";

type Player = {
  PID: number;
  Email: string;
  VIP: number | boolean;
  Points: number;
};

export function PlayersExplorer() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [vipOnly, setVipOnly] = useState(false);
  const [sortPoints, setSortPoints] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (vipOnly) params.set("vip", "1");
    params.set("sortPoints", sortPoints);
    if (search.trim()) params.set("search", search.trim());
    try {
      const res = await fetch(`/api/players?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.error(messageFromApiJson(res, data));
        setPlayers([]);
        return;
      }
      setPlayers(data.players);
    } catch {
      toast.error("Network error");
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [vipOnly, sortPoints, search]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const isVip = (p: Player) =>
    p.VIP === true || p.VIP === 1 || Number(p.VIP) === 1;

  return (
    <div className="space-y-8">
      <GlowCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label className="flex items-center gap-2 text-sm text-[#c9d4ce]">
            <input
              type="checkbox"
              checked={vipOnly}
              onChange={(e) => setVipOnly(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#050807] text-[#c9a227] focus:ring-[#c9a227]"
            />
            VIP only
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#8fa39a] lg:min-w-[200px]">
            Sort by points
            <select
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              value={sortPoints}
              onChange={(e) =>
                setSortPoints(e.target.value as "asc" | "desc")
              }
            >
              <option value="desc">High → low</option>
              <option value="asc">Low → high</option>
            </select>
          </label>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7f76]" />
          <input
            type="search"
            className="w-full rounded-xl border border-white/10 bg-[#050807] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[#5c6b64]"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </GlowCard>

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="animate-pulse space-y-px bg-white/5 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      ) : players.length === 0 ? (
        <EmptyState title="No players found" description="Adjust filters or seed the database." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#0f1815]">
                <th className="px-4 py-3 font-medium text-[#c9a227]">Email</th>
                <th className="px-4 py-3 font-medium text-[#c9a227]">VIP</th>
                <th className="px-4 py-3 font-medium text-[#c9a227]">Points</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr
                  key={p.PID}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 text-[#c9d4ce]">{p.Email}</td>
                  <td className="px-4 py-3">
                    {isVip(p) ? (
                      <span className="rounded-full border border-[#c9a227]/40 bg-[#c9a227]/15 px-2 py-0.5 text-xs font-semibold text-[#e8d48b]">
                        VIP
                      </span>
                    ) : (
                      <span className="text-[#6b7f76]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-white">
                    {Number(p.Points).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
