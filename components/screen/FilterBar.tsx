"use client";

import React from "react";

export type SortKey =
  | "ticker"
  | "price"
  | "change1d"
  | "marketCap"
  | "peRatio"
  | "pbRatio";

export type MarketCapFilter = "all" | "mega" | "large" | "mid" | "small";

export interface Filters {
  sector: string;
  marketCap: MarketCapFilter;
  sortBy: SortKey;
  sortDir: "asc" | "desc";
  search: string;
  showIncomplete: boolean;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  sectors: string[];
}

const selectClass =
  "rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50";
const selectStyle = {
  background: "var(--bg-elevated)",
  borderColor: "var(--border)",
  color: "var(--text-primary)",
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "ticker",    label: "Ticker" },
  { value: "price",     label: "Price" },
  { value: "change1d",  label: "1D %" },
  { value: "marketCap", label: "Mkt Cap" },
  { value: "peRatio",   label: "P/E" },
  { value: "pbRatio",   label: "P/B" },
];

export default function FilterBar({ filters, onChange, sectors }: FilterBarProps) {
  const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <input
        type="text"
        placeholder="Search ticker or name…"
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
        className="rounded border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-44"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
      />

      {/* Sector */}
      <div className="flex items-center gap-2">
        <label className="text-xs" style={{ color: "var(--text-muted)" }}>
          Sector
        </label>
        <select
          className={selectClass}
          style={selectStyle}
          value={filters.sector}
          onChange={(e) => set({ sector: e.target.value })}
        >
          <option value="all">All</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Market Cap */}
      <div className="flex items-center gap-2">
        <label className="text-xs" style={{ color: "var(--text-muted)" }}>
          Mkt Cap
        </label>
        <select
          className={selectClass}
          style={selectStyle}
          value={filters.marketCap}
          onChange={(e) => set({ marketCap: e.target.value as MarketCapFilter })}
        >
          <option value="all">All</option>
          <option value="mega">&gt; $200B (Mega)</option>
          <option value="large">$10B–$200B (Large)</option>
          <option value="mid">$2B–$10B (Mid)</option>
          <option value="small">&lt; $2B (Small)</option>
        </select>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <label className="text-xs" style={{ color: "var(--text-muted)" }}>
          Sort
        </label>
        <select
          className={selectClass}
          style={selectStyle}
          value={filters.sortBy}
          onChange={(e) => set({ sortBy: e.target.value as SortKey })}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            set({ sortDir: filters.sortDir === "asc" ? "desc" : "asc" })
          }
          className="rounded border px-2 py-1.5 text-xs transition-colors hover:bg-zinc-800"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          {filters.sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>
      </div>

      {/* Show incomplete */}
      <label
        className="flex items-center gap-1.5 text-xs cursor-pointer select-none"
        style={{ color: "var(--text-muted)" }}
      >
        <input
          type="checkbox"
          checked={filters.showIncomplete}
          onChange={(e) => set({ showIncomplete: e.target.checked })}
          style={{ accentColor: "var(--blue, #3b82f6)" }}
        />
        Show stocks with missing data
      </label>
    </div>
  );
}
