"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { EmptyState } from "@/components/ui/EmptyState";

type Casino = {
  CID: number;
  Name: string;
  Location: string;
  Phone: string | null;
  Capacity: number;
  Size: number;
  Manager: string;
};

export function CasinosExplorer() {
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [managers, setManagers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState("");
  const [manager, setManager] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [minSize, setMinSize] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const loadOptions = useCallback(async () => {
    const res = await fetch("/api/casinos/options");
    const data = await res.json();
    if (!data.ok) {
      toast.error(data.error || "Failed to load filter options");
      return;
    }
    setLocations(data.locations);
    setManagers(data.managers);
  }, []);

  const loadCasinos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (manager) params.set("manager", manager);
    if (minCapacity) params.set("minCapacity", minCapacity);
    if (minSize) params.set("minSize", minSize);
    if (search.trim()) params.set("search", search.trim());
    params.set("sort", sort);
    params.set("order", order);

    try {
      const res = await fetch(`/api/casinos?${params.toString()}`);
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error || "Failed to load casinos");
        setCasinos([]);
        return;
      }
      setCasinos(data.casinos);
    } catch {
      toast.error("Network error");
      setCasinos([]);
    } finally {
      setLoading(false);
    }
  }, [location, manager, minCapacity, minSize, search, sort, order]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadCasinos();
  }, [loadCasinos]);

  return (
    <div className="space-y-8">
      <GlowCard>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
            Location
            <select
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">All</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
            Manager
            <select
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
            >
              <option value="">All</option>
              {managers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
            Min capacity
            <input
              type="number"
              min={0}
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              placeholder="e.g. 500"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
            Min size (sq ft)
            <input
              type="number"
              min={0}
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              value={minSize}
              onChange={(e) => setMinSize(e.target.value)}
              placeholder="e.g. 10000"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
            Sort by
            <select
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="capacity">Capacity</option>
              <option value="size">Size</option>
              <option value="location">Location</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#8fa39a]">
            Order
            <select
              className="rounded-lg border border-white/10 bg-[#050807] px-3 py-2 text-sm text-white"
              value={order}
              onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7f76]" />
          <input
            type="search"
            className="w-full rounded-xl border border-white/10 bg-[#050807] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[#5c6b64]"
            placeholder="Search by casino name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </GlowCard>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10"
            />
          ))}
        </div>
      ) : casinos.length === 0 ? (
        <EmptyState
          title="No casinos match"
          description="Try adjusting filters or import sql/CasinoInc.sql into your database."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {casinos.map((c) => (
            <article
              key={c.CID}
              className="rounded-2xl border border-[#c9a227]/20 bg-gradient-to-br from-[#0f1815] to-[#0a100e] p-5 glow-ring glow-ring-hover transition-shadow"
            >
              <h3 className="font-display text-lg text-[#e8d48b]">{c.Name}</h3>
              <p className="mt-1 text-sm text-[#8fa39a]">{c.Location}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#c9d4ce]">
                <div>
                  <dt className="text-[#6b7f76]">Capacity</dt>
                  <dd className="font-medium tabular-nums">{c.Capacity}</dd>
                </div>
                <div>
                  <dt className="text-[#6b7f76]">Size</dt>
                  <dd className="font-medium tabular-nums">
                    {c.Size.toLocaleString()} sq ft
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[#6b7f76]">Manager</dt>
                  <dd>{c.Manager}</dd>
                </div>
                {c.Phone ? (
                  <div className="col-span-2">
                    <dt className="text-[#6b7f76]">Phone</dt>
                    <dd>{c.Phone}</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
