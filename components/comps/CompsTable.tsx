"use client";

import React from "react";
import type { CompsRow } from "@/lib/types";
import Button from "@/components/ui/Button";

interface CompsTableProps {
  rows: CompsRow[];
  onRemove: (ticker: string) => void;
  anchorTicker?: string;
}

function fmt(n: number, decimals = 1) {
  return n.toFixed(decimals);
}

function fmtB(n: number) {
  return `$${n.toFixed(1)}B`;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

const thClass = "px-3 py-2 text-left text-xs font-medium whitespace-nowrap";
const tdClass = "px-3 py-2 text-sm whitespace-nowrap";

export default function CompsTable({ rows, onRemove, anchorTicker }: CompsTableProps) {
  if (rows.length === 0) {
    return (
      <div
        className="rounded-lg border p-10 text-center text-sm"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        No tickers added yet. Type a ticker above and click &ldquo;Add Ticker&rdquo;.
      </div>
    );
  }

  // Sort anchor first
  const sorted = anchorTicker
    ? [
        ...rows.filter((r) => r.ticker === anchorTicker),
        ...rows.filter((r) => r.ticker !== anchorTicker),
      ]
    : rows;

  const medMarketCap = median(rows.map((r) => r.marketCap));
  const medEv = median(rows.map((r) => r.ev));
  const medRevenue = median(rows.map((r) => r.revenue));
  const medEbitda = median(rows.map((r) => r.ebitda));
  const medPe = median(rows.map((r) => r.peRatio));
  const medEvEbitda = median(rows.map((r) => r.evEbitda));
  const medEvRev = median(rows.map((r) => r.evRevenue));

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
            <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>Mkt Cap</th>
            <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>EV</th>
            <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>Revenue</th>
            <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>EBITDA</th>
            <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>P/E</th>
            <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>EV/EBITDA</th>
            <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>EV/Rev</th>
            <th className={`${thClass} text-center`} style={{ color: "var(--text-muted)" }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const isAnchor = r.ticker === anchorTicker;
            return (
              <tr
                key={r.ticker}
                style={{
                  background: isAnchor
                    ? "rgba(59,130,246,0.08)"
                    : i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)",
                  borderBottom: `1px solid var(--border)`,
                  borderLeft: isAnchor ? "3px solid #3b82f6" : "3px solid transparent",
                }}
                className="hover:bg-zinc-800/40 transition-colors"
              >
                <td className={tdClass}>
                  <span className="font-mono font-semibold" style={{ color: "var(--blue)" }}>
                    {r.ticker}
                  </span>
                  {isAnchor && (
                    <span
                      className="ml-2 rounded px-1.5 py-0.5 text-xs font-medium"
                      style={{ background: "rgba(59,130,246,0.2)", color: "#93c5fd" }}
                    >
                      anchor
                    </span>
                  )}
                </td>
                <td className={tdClass} style={{ color: "var(--text-secondary)" }}>
                  {r.name}
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-primary)" }}>
                  {fmtB(r.marketCap)}
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-primary)" }}>
                  {fmtB(r.ev)}
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  {fmtB(r.revenue)}
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  {fmtB(r.ebitda)}
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  {fmt(r.peRatio)}x
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  {fmt(r.evEbitda)}x
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  {fmt(r.evRevenue)}x
                </td>
                <td className={`${tdClass} text-center`}>
                  {!isAnchor && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onRemove(r.ticker)}
                      title="Remove"
                    >
                      ×
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}

          {/* Median row */}
          <tr
            style={{
              background: "var(--bg-elevated)",
              borderTop: `2px solid var(--border)`,
            }}
          >
            <td className={`${tdClass} font-semibold`} style={{ color: "var(--text-muted)" }}>
              Median
            </td>
            <td className={tdClass} />
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-primary)" }}>
              {medMarketCap !== null ? fmtB(medMarketCap) : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-primary)" }}>
              {medEv !== null ? fmtB(medEv) : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-secondary)" }}>
              {medRevenue !== null ? fmtB(medRevenue) : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-secondary)" }}>
              {medEbitda !== null ? fmtB(medEbitda) : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-secondary)" }}>
              {medPe !== null ? `${fmt(medPe)}x` : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-secondary)" }}>
              {medEvEbitda !== null ? `${fmt(medEvEbitda)}x` : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-secondary)" }}>
              {medEvRev !== null ? `${fmt(medEvRev)}x` : "—"}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
