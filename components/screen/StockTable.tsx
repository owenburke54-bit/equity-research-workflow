"use client";

import React from "react";
import type { Stock } from "@/lib/types";
import Badge from "@/components/ui/Badge";

interface StockTableProps {
  stocks: Stock[];
  watchlist: string[];
  onToggleWatchlist: (ticker: string) => void;
  selectedTicker?: string;
  onSelect?: (ticker: string) => void;
}

function fmt(n: number, decimals = 1) {
  return n.toFixed(decimals);
}

function fmtCap(n: number) {
  if (n <= 0) return "—";
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}T`;
  return `$${n.toFixed(1)}B`;
}

function fmtNum(n: number, suffix = "x") {
  if (!n || n <= 0) return "—";
  return `${n.toFixed(1)}${suffix}`;
}

function fmtPrice(n: number) {
  if (!n) return "—";
  return `$${n.toFixed(2)}`;
}

const thClass = "px-3 py-2 text-left text-xs font-medium whitespace-nowrap";
const tdClass = "px-3 py-2 text-sm whitespace-nowrap";

export default function StockTable({
  stocks,
  watchlist,
  onToggleWatchlist,
  selectedTicker,
  onSelect,
}: StockTableProps) {
  if (stocks.length === 0) {
    return (
      <div
        className="rounded-lg border p-8 text-center text-sm"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        No stocks match the current filters.
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border"
      style={{ borderColor: "var(--border)" }}
    >
      <table className="w-full border-collapse text-left">
        <thead>
          <tr
            style={{
              background: "var(--bg-elevated)",
              borderBottom: `1px solid var(--border)`,
            }}
          >
            <th className={thClass} style={{ color: "var(--text-muted)" }}>Ticker</th>
            <th className={thClass} style={{ color: "var(--text-muted)" }}>Name</th>
            <th className={thClass} style={{ color: "var(--text-muted)" }}>Sector</th>
            <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>Price</th>
            <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>1D %</th>
            <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>Mkt Cap</th>
            <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>P/E</th>
            <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>P/B</th>
            <th className={`${thClass} text-center`} style={{ color: "var(--text-muted)" }}>★</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((s, i) => {
            const starred = watchlist.includes(s.ticker);
            const selected = s.ticker === selectedTicker;
            return (
              <tr
                key={s.ticker}
                onClick={() => onSelect?.(s.ticker)}
                style={{
                  background: selected
                    ? "rgba(59,130,246,0.08)"
                    : i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)",
                  borderBottom: `1px solid var(--border)`,
                  borderLeft: selected ? "3px solid #3b82f6" : "3px solid transparent",
                  cursor: onSelect ? "pointer" : undefined,
                }}
                className="hover:bg-zinc-800/40 transition-colors"
              >
                <td className={tdClass}>
                  <span
                    className="font-mono font-semibold"
                    style={{ color: "var(--blue)" }}
                  >
                    {s.ticker}
                  </span>
                </td>
                <td
                  className={tdClass}
                  style={{ color: "var(--text-secondary)", maxWidth: "200px" }}
                >
                  <span className="block truncate">{s.name}</span>
                </td>
                <td className={tdClass} style={{ color: "var(--text-muted)" }}>
                  <span className="block truncate max-w-[140px]">{s.sector}</span>
                </td>
                <td
                  className={`${tdClass} text-right font-mono`}
                  style={{ color: "var(--text-primary)" }}
                >
                  {fmtPrice(s.price)}
                </td>
                <td className={`${tdClass} text-right`}>
                  {s.price > 0 ? (
                    <Badge variant={s.change1d >= 0 ? "green" : "red"}>
                      {s.change1d >= 0 ? "+" : ""}
                      {fmt(s.change1d, 2)}%
                    </Badge>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
                <td
                  className={`${tdClass} text-right font-mono`}
                  style={{ color: "var(--text-primary)" }}
                >
                  {fmtCap(s.marketCap)}
                </td>
                <td
                  className={`${tdClass} text-right font-mono`}
                  style={{ color: "var(--text-secondary)" }}
                >
                  {fmtNum(s.peRatio)}
                </td>
                <td
                  className={`${tdClass} text-right font-mono`}
                  style={{ color: "var(--text-secondary)" }}
                >
                  {fmtNum(s.pbRatio)}
                </td>
                <td className={`${tdClass} text-center`}>
                  <button
                    onClick={() => onToggleWatchlist(s.ticker)}
                    className="text-lg leading-none transition-all hover:scale-110 focus:outline-none"
                    title={starred ? "Remove from watchlist" : "Add to watchlist"}
                    style={{ color: starred ? "#f59e0b" : "var(--text-muted)" }}
                  >
                    {starred ? "★" : "☆"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
