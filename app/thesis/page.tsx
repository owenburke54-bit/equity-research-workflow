"use client";

import { useState, useEffect, startTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWatchlist, useThesis } from "@/lib/storage";
import { getAllTickers } from "@/lib/mock-data";
import ThesisEditor from "@/components/thesis/ThesisEditor";
import ModelChecklist from "@/components/thesis/ModelChecklist";

const ALL_TICKERS = getAllTickers();

function ThesisContent() {
  const searchParams = useSearchParams();
  const anchorParam = searchParams.get("anchor");
  const { watchlist } = useWatchlist();
  const [selectedTicker, setSelectedTicker] = useState(anchorParam ?? "");
  const { note, save } = useThesis(selectedTicker);

  // Default to first watchlisted ticker, then first available (only if no anchor param)
  useEffect(() => {
    if (selectedTicker) return;
    startTransition(() => {
      if (watchlist.length > 0) setSelectedTicker(watchlist[0]);
      else setSelectedTicker(ALL_TICKERS[0]);
    });
  }, [watchlist, selectedTicker]);

  const selectClass =
    "rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50";
  const selectStyle = {
    background: "var(--bg-elevated)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <>
      {/* Ticker selector */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Ticker
        </label>
        <select
          className={selectClass}
          style={selectStyle}
          value={selectedTicker}
          onChange={(e) => setSelectedTicker(e.target.value)}
        >
          {watchlist.length > 0 && (
            <optgroup label="Watchlist">
              {watchlist.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="All Tickers">
            {ALL_TICKERS.filter((t) => !watchlist.includes(t)).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </optgroup>
        </select>

        {watchlist.length === 0 && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Tip: star stocks in the Screener to populate your watchlist here.
          </span>
        )}
      </div>

      {selectedTicker ? (
        <div className="flex flex-col gap-5">
          <ThesisEditor note={note} onSave={save} />
          <ModelChecklist note={note} onSave={save} />
        </div>
      ) : (
        <div
          className="rounded-lg border p-10 text-center text-sm"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
        >
          Select a ticker above to get started.
        </div>
      )}
    </>
  );
}

export default function ThesisPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-1">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Thesis Builder
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Document your investment thesis and track model build progress for each ticker.
        </p>
      </div>

      <Suspense fallback={null}>
        <ThesisContent />
      </Suspense>
    </div>
  );
}
