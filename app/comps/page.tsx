"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWorkingSet, useResearchSets } from "@/lib/working-set";
import CompsTable from "@/components/comps/CompsTable";
import type { CompsRow, ResearchSet } from "@/lib/types";
import Link from "next/link";

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

export default function CompsPage() {
  const router = useRouter();
  const { ws, removeComp } = useWorkingSet();
  const { saveSet } = useResearchSets();
  const [rows, setRows] = useState<CompsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const compKey = ws?.compTickers.join(",") ?? "";

  useEffect(() => {
    if (!ws) return;
    const tickers = [ws.anchorTicker, ...ws.compTickers];
    setLoading(true);
    setRows([]);
    Promise.all(
      tickers.map((t) =>
        fetch(`/api/quote/${t}`)
          .then((r) => r.json())
          .then((d: { compsRow?: CompsRow }) => d.compsRow ?? null)
          .catch(() => null)
      )
    ).then((results) => {
      setRows(results.filter((r): r is CompsRow => r !== null));
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.anchorTicker, compKey]);

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
      compsSnapshot: rows,
      thesis,
      assumptions: "",
    };
    saveSet(set);
    setSaved(true);
    setSaving(false);
    setSaveName("");
  }, [ws, saveName, rows, saveSet]);

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
            {rows.length > 0 && (
              <button
                onClick={() => exportCsv(rows, ws.anchorTicker)}
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
            {!saving && !saved && rows.length > 0 && (
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

      {loading ? (
        <div
          className="rounded-lg border p-12 text-center text-sm"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
        >
          Loading data for {ws.anchorTicker} + {ws.compTickers.length} peers…
        </div>
      ) : (
        <CompsTable
          rows={rows}
          onRemove={removeComp}
          anchorTicker={ws.anchorTicker}
        />
      )}
    </div>
  );
}
