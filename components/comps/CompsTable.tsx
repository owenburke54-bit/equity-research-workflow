"use client";

import React from "react";
import type { CompsRow } from "@/lib/types";
import Button from "@/components/ui/Button";

type MultipleField = "peRatio" | "evEbitda" | "evRevenue" | "ebitda" | "revenue";

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

// ── Formatters ────────────────────────────────────────────────────────────────

/** Dollar value in billions, 2 decimal places. e.g. $55.12B */
function fmtB(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}T`;
  if (n >= 1) return `$${n.toFixed(2)}B`;
  if (n > 0) return `$${(n * 1000).toFixed(0)}M`;
  return "—";
}

/** Percentage with sign and 2 decimal places. e.g. +12.34% */
function fmtPct(n: number): string {
  if (n === 0) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

/** Trailing EPS as dollar value. e.g. $6.43 */
function fmtEps(n: number): string {
  if (!n || n === 0) return "—";
  return `$${n.toFixed(2)}`;
}

/** Valuation multiples, 1 decimal place (convention). e.g. 30.2x */
function fmtMultiple(n: number): string {
  if (!n || n <= 0) return "—";
  return `${n.toFixed(1)}x`;
}

function median(nums: number[]): number | null {
  const valid = nums.filter((n) => n !== 0 && isFinite(n));
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ── Shared cell styles ────────────────────────────────────────────────────────

const thClass =
  "px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap";
const tdClass = "px-3 py-2 text-sm whitespace-nowrap";

// ── Premium badge ─────────────────────────────────────────────────────────────

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

// ── Editable cells ────────────────────────────────────────────────────────────

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
    e.target.value = saved > 0 ? saved.toFixed(1) + "x" : "";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "Escape") {
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

function EditableFinancial({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    const stripped = e.target.value.replace(/^\$/, "").replace(/[BMT]$/, "").trim();
    e.target.value = stripped;
    e.target.select();
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const parsed = parseFloat(e.target.value.trim());
    const saved = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    if (saved !== value) onSave(saved);
    e.target.value = saved > 0 ? `$${saved.toFixed(2)}B` : "";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "Escape") {
      (e.target as HTMLInputElement).value = value > 0 ? value.toFixed(2) : "";
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <input
      key={value}
      type="text"
      inputMode="decimal"
      defaultValue={value > 0 ? `$${value.toFixed(2)}B` : ""}
      placeholder="—"
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      title="Click to edit (enter value in $B)"
      className="w-20 cursor-pointer rounded border border-transparent bg-transparent px-1 text-right text-sm font-mono placeholder:opacity-40 transition-colors hover:border-zinc-600 focus:cursor-text focus:border-blue-500/60 focus:bg-[var(--bg-elevated)] focus:outline-none"
    />
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

// Column widths (px) per row: Ticker, Name, MktCap, EV, Rev(TTM), RevGrowth, GrossMargin, EPS, P/E, EV/EBITDA, EV/Rev
const SKELETON_ROWS: number[][] = [
  [48, 112, 64, 60, 64, 52, 52, 44, 40, 44, 40],
  [40,  96, 72, 68, 56, 44, 60, 40, 48, 40, 48],
  [56, 128, 60, 64, 72, 56, 48, 48, 36, 48, 36],
  [40,  80, 64, 60, 52, 48, 52, 44, 44, 40, 44],
  [48, 112, 72, 68, 56, 52, 56, 40, 40, 36, 40],
  [44,  88, 60, 64, 64, 44, 48, 48, 36, 44, 36],
];

// ── Headers ───────────────────────────────────────────────────────────────────

const HEADERS = (
  <tr
    style={{
      background: "var(--bg-elevated)",
      borderBottom: "2px solid var(--border)",
    }}
  >
    <th className={thClass} style={{ color: "var(--text-secondary)" }}>Ticker</th>
    <th className={thClass} style={{ color: "var(--text-secondary)" }}>Name</th>
    <th className={`${thClass} text-right`} style={{ color: "var(--text-secondary)" }}>Mkt Cap</th>
    <th className={`${thClass} text-right`} style={{ color: "var(--text-secondary)" }}>EV</th>
    <th className={`${thClass} text-right`} style={{ color: "var(--text-secondary)" }}>Rev (TTM)</th>
    <th
      className={`${thClass} text-right`}
      style={{ color: "var(--text-secondary)", cursor: "help" }}
      title="Year-over-year revenue growth (most recent quarter vs. same quarter prior year)"
    >
      Rev Growth
    </th>
    <th
      className={`${thClass} text-right`}
      style={{ color: "var(--text-secondary)", cursor: "help" }}
      title="Gross Margin — TTM gross profit / TTM revenue"
    >
      Gross Margin
    </th>
    <th
      className={`${thClass} text-right`}
      style={{ color: "var(--text-secondary)", cursor: "help" }}
      title="Trailing 12-month diluted EPS"
    >
      EPS (TTM)
    </th>
    <th className={`${thClass} text-right`} style={{ color: "var(--text-secondary)" }}>P/E</th>
    <th
      className={`${thClass} text-right`}
      style={{ color: "var(--text-secondary)", cursor: "help" }}
      title="Enterprise Value / EBITDA — lower multiple = cheaper"
    >
      EV/EBITDA
    </th>
    <th
      className={`${thClass} text-right`}
      style={{ color: "var(--text-secondary)", cursor: "help" }}
      title="Enterprise Value / Revenue — useful when EBITDA is negative or not meaningful"
    >
      EV/Rev
    </th>
    <th className={`${thClass} text-center`} style={{ color: "var(--text-secondary)" }} />
  </tr>
);

// ── Main component ────────────────────────────────────────────────────────────

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

  // Anchor row always first
  const sorted = anchorTicker
    ? [
        ...rows.filter((r) => r.ticker === anchorTicker),
        ...rows.filter((r) => r.ticker !== anchorTicker),
      ]
    : rows;

  // Median calculations — exclude zeros/invalid from all numeric columns
  const medMarketCap  = median(rows.map((r) => r.marketCap));
  const medEv         = median(rows.map((r) => r.ev));
  const medRevenue    = median(rows.map((r) => r.revenue));
  const medRevGrowth  = median(rows.map((r) => r.revenueGrowth));
  const medGrossMargin = median(rows.map((r) => r.grossMargin));
  const medEps        = median(rows.map((r) => r.eps));
  const medPe         = median(rows.map((r) => r.peRatio));
  const medEvEbitda   = median(rows.map((r) => r.evEbitda));
  const medEvRev      = median(rows.map((r) => r.evRevenue));

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
            const revGrowthColor =
              r.revenueGrowth > 0 ? "#22c55e" : r.revenueGrowth < 0 ? "#ef4444" : "var(--text-secondary)";

            return (
              <tr
                key={r.ticker}
                style={{
                  background: isAnchor
                    ? "rgba(59,130,246,0.08)"
                    : i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)",
                  borderBottom: "1px solid var(--border)",
                  borderLeft: isAnchor ? "3px solid #3b82f6" : "3px solid transparent",
                }}
                className="hover:bg-zinc-800/40 transition-colors"
              >
                {/* Ticker */}
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

                {/* Name */}
                <td className={tdClass} style={{ color: "var(--text-secondary)" }}>
                  {r.name}
                </td>

                {/* Mkt Cap */}
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-primary)" }}>
                  {fmtB(r.marketCap)}
                </td>

                {/* EV */}
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-primary)" }}>
                  {fmtB(r.ev)}
                </td>

                {/* Rev (TTM) — editable */}
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  <EditableFinancial
                    value={r.revenue}
                    onSave={(v) => onOverride?.(r.ticker, "revenue", v)}
                  />
                </td>

                {/* Rev Growth (YoY) */}
                <td className={`${tdClass} text-right font-mono`} style={{ color: revGrowthColor }}>
                  {fmtPct(r.revenueGrowth)}
                </td>

                {/* Gross Margin */}
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  {r.grossMargin !== 0 ? `${r.grossMargin.toFixed(2)}%` : "—"}
                </td>

                {/* EPS (TTM) */}
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  {fmtEps(r.eps)}
                </td>

                {/* P/E — editable */}
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

                {/* EV/EBITDA — editable */}
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

                {/* EV/Rev — editable */}
                <td className={`${tdClass} text-right font-mono`} style={{ color: "var(--text-secondary)" }}>
                  <EditableMultiple
                    value={r.evRevenue}
                    onSave={(v) => onOverride?.(r.ticker, "evRevenue", v)}
                  />
                </td>

                {/* Remove */}
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
              borderTop: "2px solid var(--border)",
            }}
          >
            <td className={`${tdClass} font-bold`} style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              MEDIAN
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
            <td
              className={`${tdClass} text-right font-mono font-semibold`}
              style={{
                color: medRevGrowth != null
                  ? medRevGrowth > 0 ? "#22c55e" : "#ef4444"
                  : "var(--text-secondary)",
              }}
            >
              {medRevGrowth !== null ? fmtPct(medRevGrowth) : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-secondary)" }}>
              {medGrossMargin !== null ? `${medGrossMargin.toFixed(2)}%` : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-secondary)" }}>
              {medEps !== null ? fmtEps(medEps) : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-secondary)" }}>
              {medPe !== null ? fmtMultiple(medPe) : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-secondary)" }}>
              {medEvEbitda !== null ? fmtMultiple(medEvEbitda) : "—"}
            </td>
            <td className={`${tdClass} text-right font-mono font-semibold`} style={{ color: "var(--text-secondary)" }}>
              {medEvRev !== null ? fmtMultiple(medEvRev) : "—"}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
