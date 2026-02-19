"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWorkingSet, useResearchSets } from "@/lib/working-set";
import CompsTable from "@/components/comps/CompsTable";
import type { CompsRow, ResearchSet } from "@/lib/types";
import Link from "next/link";

type MultipleField = "peRatio" | "evEbitda" | "evRevenue";
type Overrides = Record<string, Partial<Record<MultipleField, number>>>;

function exportCsv(rows: CompsRow[], anchorTicker: string) {
  const headers = ["Ticker", "Name", "Mkt Cap ($B)", "EV ($B)", "Revenue ($B)", "EBITDA ($B)", "P/E", "EV/EBITDA", "EV/Rev"];
  const csvRows = rows.map((r) => [
    r.ticker,
    `"${r.name}"`,
    r.marketCap.toFixed(1),
    r.ev.toFixed(1),
    r.revenue.toFixed(1),
    r.ebitda.toFixed(1),
    r.peRatio.toFixed(1),
    r.evEbitda.toFixed(1),
    r.evRevenue.toFixed(1),
  ]);
  const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `comps-${anchorTicker}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function medianOf(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function PremiumBadge({ pct }: { pct: number }) {
  const isDiscount = pct < 0;
  const color = isDiscount ? "#22c55e" : "#ef4444";
  const bg = isDiscount ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)";
  return (
    <span
      className="rounded px-1.5 py-0.5 text-xs font-semibold"
      style={{ background: bg, color }}
    >
      {isDiscount ? "▼" : "▲"}{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

export default function CompsPage() {
  const router = useRouter();
  const { ws, removeComp } = useWorkingSet();
  const { saveSet } = useResearchSets();
  const [rows, setRows] = useState<CompsRow[]>([]);
  const [anchorPrice, setAnchorPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load persisted overrides on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("er:comps-overrides") ?? "{}") as Overrides;
      setOverrides(stored);
    } catch {
      // ignore
    }
  }, []);

  // Merge API rows with manual overrides
  const effectiveRows = useMemo(
    () => rows.map((r) => ({ ...r, ...(overrides[r.ticker] ?? {}) })),
    [rows, overrides]
  );

  const compKey = ws?.compTickers.join(",") ?? "";

  useEffect(() => {
    if (!ws) return;
    const anchorTicker = ws.anchorTicker;
    const tickers = [anchorTicker, ...ws.compTickers];
    setLoading(true);
    setRows([]);
    setAnchorPrice(0);
    Promise.all(
      tickers.map((t) =>
        fetch(`/api/quote/${t}`)
          .then((r) => r.json())
          .then((d: { compsRow?: CompsRow; stock?: { price: number } }) => ({
            ticker: t,
            compsRow: d.compsRow ?? null,
            price: d.stock?.price ?? 0,
          }))
          .catch(() => ({ ticker: t, compsRow: null, price: 0 }))
      )
    ).then((results) => {
      const validRows = results
        .map((r) => r.compsRow)
        .filter((r): r is CompsRow => r !== null);
      const anchorResult = results.find((r) => r.ticker === anchorTicker);
      setRows(validRows);
      setAnchorPrice(anchorResult?.price ?? 0);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.anchorTicker, compKey]);

  // Keep er:rel-val in sync whenever effective rows or price change
  useEffect(() => {
    const anchorTicker = ws?.anchorTicker;
    if (!anchorTicker || anchorPrice <= 0 || effectiveRows.length <= 1) return;
    const anchorRow = effectiveRows.find((r) => r.ticker === anchorTicker);
    if (!anchorRow) return;
    const medPE = medianOf(effectiveRows.map((r) => r.peRatio));
    const medEvEbitda = medianOf(effectiveRows.map((r) => r.evEbitda));
    const impliedPricePE =
      anchorRow.peRatio > 0 && medPE && medPE > 0
        ? anchorPrice * (medPE / anchorRow.peRatio)
        : 0;
    const impliedPriceEvEbitda =
      anchorRow.evEbitda > 0 && medEvEbitda && medEvEbitda > 0
        ? anchorPrice * (medEvEbitda / anchorRow.evEbitda)
        : 0;
    localStorage.setItem(
      `er:rel-val:${anchorTicker}`,
      JSON.stringify({ anchorPrice, impliedPricePE, impliedPriceEvEbitda })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRows, anchorPrice, ws?.anchorTicker]);

  const handleOverride = useCallback(
    (ticker: string, field: MultipleField, value: number) => {
      setOverrides((prev) => {
        const tickerOverrides = { ...prev[ticker] };
        if (value === 0) {
          delete tickerOverrides[field];
        } else {
          tickerOverrides[field] = value;
        }
        const next = { ...prev, [ticker]: tickerOverrides };
        if (Object.keys(tickerOverrides).length === 0) delete next[ticker];
        localStorage.setItem("er:comps-overrides", JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!ws || !saveName.trim()) return;
    const thesis = (() => {
      try {
        return JSON.parse(
          localStorage.getItem(`er:thesis:${ws.anchorTicker}`) ?? "null"
        );
      } catch {
        return null;
      }
    })();
    const set: ResearchSet = {
      id: Date.now().toString(),
      name: saveName.trim(),
      createdAt: new Date().toISOString(),
      anchorTicker: ws.anchorTicker,
      compTickers: ws.compTickers,
      compsSnapshot: effectiveRows,
      thesis,
      assumptions: "",
    };
    saveSet(set);
    setSaved(true);
    setSaving(false);
    setSaveName("");
  }, [ws, saveName, effectiveRows, saveSet]);

  if (!ws) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div
          className="rounded-lg border p-12 text-center text-sm"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <p className="mb-4">No working set found. Go to the Screener to select an anchor stock.</p>
          <Link
            href="/screen"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Go to Screener →
          </Link>
        </div>
      </div>
    );
  }

  // Derived valuation values for snapshot card (use effective rows)
  const anchorRow = effectiveRows.find((r) => r.ticker === ws.anchorTicker) ?? null;
  const medPE = effectiveRows.length > 1 ? medianOf(effectiveRows.map((r) => r.peRatio)) : null;
  const medEvEbitda = effectiveRows.length > 1 ? medianOf(effectiveRows.map((r) => r.evEbitda)) : null;
  const anchorPE = anchorRow?.peRatio ?? 0;
  const anchorEvEbitda = anchorRow?.evEbitda ?? 0;

  const pePremiumPct =
    anchorPrice > 0 && anchorPE > 0 && medPE && medPE > 0
      ? ((anchorPE / medPE) - 1) * 100
      : null;
  const evEbitdaPremiumPct =
    anchorPrice > 0 && anchorEvEbitda > 0 && medEvEbitda && medEvEbitda > 0
      ? ((anchorEvEbitda / medEvEbitda) - 1) * 100
      : null;
  const impliedPricePE =
    anchorPrice > 0 && anchorPE > 0 && medPE && medPE > 0
      ? anchorPrice * (medPE / anchorPE)
      : 0;
  const impliedPriceEvEbitda =
    anchorPrice > 0 && anchorEvEbitda > 0 && medEvEbitda && medEvEbitda > 0
      ? anchorPrice * (medEvEbitda / anchorEvEbitda)
      : 0;

  const showCard =
    anchorRow !== null &&
    effectiveRows.length > 1 &&
    (pePremiumPct !== null || evEbitdaPremiumPct !== null);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Comparable Companies
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Anchor:{" "}
              <span className="font-mono font-semibold" style={{ color: "var(--blue)" }}>
                {ws.anchorTicker}
              </span>{" "}
              · {ws.compTickers.length} peers
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {effectiveRows.length > 0 && (
              <button
                onClick={() => exportCsv(effectiveRows, ws.anchorTicker)}
                className="rounded border px-3 py-1.5 text-sm transition-colors hover:bg-zinc-700"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Export CSV
              </button>
            )}
            <button
              onClick={() => router.push(`/thesis?anchor=${ws.anchorTicker}`)}
              className="rounded border px-3 py-1.5 text-sm transition-colors hover:bg-zinc-700"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              Promote to Thesis →
            </button>
            {!saving && !saved && effectiveRows.length > 0 && (
              <button
                onClick={() => setSaving(true)}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Save Research Set
              </button>
            )}
            {saved && (
              <Link
                href="/research"
                className="rounded bg-green-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-600"
              >
                Saved → View Research
              </Link>
            )}
          </div>
        </div>

        {/* Inline save name input */}
        {saving && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") { setSaving(false); setSaveName(""); }
              }}
              placeholder={`Name this research set (e.g. "${ws.anchorTicker} vs Peers")`}
              className="flex-1 rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                maxWidth: "400px",
              }}
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => { setSaving(false); setSaveName(""); }}
              className="rounded px-3 py-1.5 text-sm hover:bg-zinc-700"
              style={{ color: "var(--text-muted)" }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Relative Valuation Snapshot */}
      {showCard && (
        <div
          className="mb-6 rounded-lg border p-4"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Relative Valuation Snapshot
          </p>
          <div className="flex flex-col gap-2">
            {pePremiumPct !== null && (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="w-20 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  P/E
                </span>
                <span className="font-mono" style={{ color: "var(--text-primary)" }}>
                  {anchorPE.toFixed(1)}x
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>vs median</span>
                <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                  {medPE!.toFixed(1)}x
                </span>
                <PremiumBadge pct={pePremiumPct} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>→ implied</span>
                <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                  ${impliedPricePE.toFixed(2)}
                </span>
              </div>
            )}
            {evEbitdaPremiumPct !== null && (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="w-20 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  EV/EBITDA
                </span>
                <span className="font-mono" style={{ color: "var(--text-primary)" }}>
                  {anchorEvEbitda.toFixed(1)}x
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>vs median</span>
                <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                  {medEvEbitda!.toFixed(1)}x
                </span>
                <PremiumBadge pct={evEbitdaPremiumPct} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>→ implied</span>
                <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                  ${impliedPriceEvEbitda.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <CompsTable
        rows={effectiveRows}
        onRemove={removeComp}
        anchorTicker={ws.anchorTicker}
        loading={loading}
        anchorValuation={
          effectiveRows.length > 1 && anchorRow !== null
            ? { pePremiumPct, evEbitdaPremiumPct }
            : undefined
        }
        onOverride={handleOverride}
      />
    </div>
  );
}
