"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface TickerSearchProps {
  currentTicker: string;
  watchlist: string[];
  onSelect: (ticker: string, name: string) => void;
}

export default function TickerSearch({ currentTicker, watchlist, onSelect }: TickerSearchProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    const t = input.trim().toUpperCase();
    if (!t) return;
    if (t === currentTicker) {
      setInput("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/quote/${t}`);
      const data = await res.json() as { stock?: { name?: string }; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? `"${t}" not found. Check the symbol and try again.`);
        return;
      }

      onSelect(t, data.stock?.name ?? t);
      setInput("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") {
      setInput("");
      setError("");
    }
  }

  // Watchlist chips — click directly selects without re-validating
  // The ticker is already known-good from when it was added to the watchlist.
  // Name will be populated by the parent's existing price-fetch effect.
  function handleWatchlistClick(ticker: string) {
    if (ticker === currentTicker) return;
    onSelect(ticker, "");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Ticker
        </label>
        <input
          type="text"
          placeholder="Any ticker (e.g. AAPL, TSM, ASML)"
          value={input}
          onChange={(e) => {
            setInput(e.target.value.toUpperCase());
            setError("");
          }}
          onKeyDown={handleKeyDown}
          disabled={loading}
          spellCheck={false}
          className="w-48 rounded border px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
        <Button variant="primary" size="sm" onClick={handleSearch} disabled={loading || !input.trim()}>
          {loading ? "Looking up…" : "Load"}
        </Button>

        {/* Watchlist quick-select */}
        {watchlist.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Watchlist:</span>
            {watchlist.map((t) => (
              <button
                key={t}
                onClick={() => handleWatchlistClick(t)}
                className="rounded px-2 py-0.5 font-mono text-xs font-semibold transition-colors"
                style={
                  t === currentTicker
                    ? { background: "rgba(59,130,246,0.2)", color: "#93c5fd", cursor: "default" }
                    : { background: "var(--bg-elevated)", color: "var(--text-secondary)", cursor: "pointer" }
                }
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs" style={{ color: "var(--red)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
