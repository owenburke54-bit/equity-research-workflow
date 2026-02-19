"use client";

import React from "react";
import type { CompsRow } from "@/lib/types";
import Button from "@/components/ui/Button";

type MultipleField = "peRatio" | "evEbitda" | "evRevenue";

interface AnchorValuation {
  pePremiumPct: number | null;
  evEbitdaPremiumPct: number | null;
}

interface CompsTableProps {
  rows: CompsRow[];
  onRemove: (ticker: string) => void;
  anchorTicker?: string;
  loading?: boolean;
  anchorValuation?: AnchorValuation;
  onOverride?: (ticker: string, field: MultipleField, value: number) => void;
}

function fmt(n: number, decimals = 1) {
  return n.toFixed(decimals);
}

function fmtMBT(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}T`;
  if (n >= 1) return `$${n.toFixed(1)}B`;
  if (n > 0) return `$${(n * 1000).toFixed(0)}M`;
  return "—";
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

function PremiumBadge({ pct }: { pct: number }) {
  const isDiscount = pct < 0;
  const color = isDiscount ? "#22c55e" : "#ef4444";
  const arrow = isDiscount ? "▼" : "▲";
  const sign = pct >= 0 ? "+" : "";
  return (
    <span className="ml-1.5 text-xs font-medium" style={{ color }}>
      {arrow}{sign}{pct.toFixed(1)}%
    </span>
  );
}

// Always-visible input styled as text. key={value} resets it when an override
// is applied from outside. onFocus strips the "x" suffix for clean editing;
// onBlur restores it and saves if the value changed.
function EditableMultiple({
  value,
  onSave,
}: {
  value: number;
  onSave: (v: number) => void;
}) {
  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (v.endsWith("x")) e.target.value = v.slice(0, -1);
    e.target.select();
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const parsed = parseFloat(e.target.value.trim());
    const saved = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    if (saved !== value) onSave(saved);
    // Restore display format (with "x" suffix)
    e.target.value = saved > 0 ? saved.toFixed(1) + "x" : "";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "Escape") {
      // Reset to original value without saving
      (e.target as HTMLInputElement).value = value > 0 ? value.toFixed(1) : "";
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <input
      key={value}
      type="text"
      inputMode="decimal"
      defaultValue={value > 0 ? value.toFixed(1) + "x" : ""}
      placeholder="—"
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      title="Click to edit"
      className="w-14 cursor-pointer rounded border border-transparent bg-transparent px-1 text-right text-sm font-mono placeholder:opacity-40 transition-colors hover:border-zinc-600 focus:cursor-text focus:border-blue-500/60 focus:bg-[var(--bg-elevated)] focus:outline-none"
    />
  );
}

// Skeleton row widths (px) per data column: Ticker, Name, MktCap, EV, Rev, EBITDA, PE, EV/EBITDA, EV/Rev
const SKELETON_ROWS: number[][] = [
  [48, 112, 56, 56, 64, 56, 40, 44, 40],
  [40, 96, 64, 64, 56, 48, 48, 40, 48],
  [56, 128, 52, 56, 72, 56, 36, 48, 36],
  [40, 80, 56, 52, 52, 56, 44, 40, 44],
  [48, 112, 64, 64, 56, 44, 40, 36, 40],
  [44, 88, 52, 56, 64, 48, 36, 44, 36],
];

const HEADERS = (
  <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
    <th className={thClass} style={{ color: "var(--text-muted)" }}>Ticker</th>
    <th className={thClass} style={{ color: "var(--text-muted)" }}>Name</th>
    <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>Mkt Cap</th>
    <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>EV</th>
    <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>Revenue</th>
    <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>EBITDA</th>
    <th className={`${thClass} text-right`} style={{ color: "var(--text-muted)" }}>P/E</th>
    <th
      className={`${thClass} text-right`}
      style={{ color: "var(--text-muted)", cursor: "help" }}
      title="Enterprise Value / EBITDA — lower multiple = cheaper"
    >
      EV/EBITDA
    </th>
    <th
      className={`${thClass} text-right`}
      style={{ color: "var(--text-muted)", cursor: "help" }}
      title="Enterprise Value / Revenue — useful when EBITDA is negative or not meaningful"
    >
      EV/Rev
    </th>
    <th className={`${thClass} text-center`} style={{ color: "var(--text-muted)" }}></th>
  </tr>
);

export default function CompsTable({
  rows,
  onRemove,
  anchorTicker,
  loading,
  anchorValuation,
  onOverride,
}: CompsTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full border-collapse text-left">
          <thead>{HEADERS}</thead>
          <tbody>
            {SKELETON_ROWS.map((widths, i) => (
              <tr
                key={i}
                style={{
                  background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {widths.map((w, j) => (
                  <td key={j} className={j >= 2 ? `${tdClass} text-right` : tdClass}>
                    <div
                      className="animate-pulse rounded"
                      style={{
                        width: w,
                        height: 12,
                        background: "var(--bg-elevated)",
                        marginLeft: j >= 2 ? "auto" : undefined,
                      }}
                    />
                  </td>
                ))}
                <td className={tdClass} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

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
        <thead>{HEADERS}</thead>
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
                  {fmtMBT(r.marketCap)}
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-primary)" }}>
                  {fmtMBT(r.ev)}
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  {fmtMBT(r.revenue)}
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  {fmtMBT(r.ebitda)}
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  <span className="inline-flex items-center justify-end">
                    <EditableMultiple
                      value={r.peRatio}
                      onSave={(v) => onOverride?.(r.ticker, "peRatio", v)}
                    />
                    {isAnchor && anchorValuation?.pePremiumPct != null && (
                      <PremiumBadge pct={anchorValuation.pePremiumPct} />
                    )}
                  </span>
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  <span className="inline-flex items-center justify-end">
                    <EditableMultiple
                      value={r.evEbitda}
                      onSave={(v) => onOverride?.(r.ticker, "evEbitda", v)}
                    />
                    {isAnchor && anchorValuation?.evEbitdaPremiumPct != null && (
                      <PremiumBadge pct={anchorValuation.evEbitdaPremiumPct} />
                    )}
                  </span>
                </td>
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  <EditableMultiple
                    value={r.evRevenue}
                    onSave={(v) => onOverride?.(r.ticker, "evRevenue", v)}
                  />
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
              {medMarketCap !== null ? fmtMBT(medMarketCap) : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-primary)" }}>
              {medEv !== null ? fmtMBT(medEv) : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-secondary)" }}>
              {medRevenue !== null ? fmtMBT(medRevenue) : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-secondary)" }}>
              {medEbitda !== null ? fmtMBT(medEbitda) : "—"}
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
