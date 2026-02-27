"use client";

import { useState, useEffect, startTransition, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWatchlist, useThesis } from "@/lib/storage";
import { useResearchSets } from "@/lib/working-set";
import type { WorkingSet, ResearchSet } from "@/lib/types";
import TickerSearch from "@/components/thesis/TickerSearch";
import ThesisEditor from "@/components/thesis/ThesisEditor";
import ModelChecklist from "@/components/thesis/ModelChecklist";
import Link from "next/link";

function ThesisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const anchorParam = searchParams.get("anchor");

  const { watchlist } = useWatchlist();
  const { sets: researchSets } = useResearchSets();

  const [selectedTicker, setSelectedTicker] = useState(anchorParam?.toUpperCase() ?? "");
  const [selectedName, setSelectedName] = useState("");

  const { note, save } = useThesis(selectedTicker);

  const [currentPrice, setCurrentPrice] = useState(0);
  const [impliedPricePE, setImpliedPricePE] = useState(0);
  const [impliedPriceEvEbitda, setImpliedPriceEvEbitda] = useState(0);

  // Load relative valuation data and current price whenever selected ticker changes
  useEffect(() => {
    if (!selectedTicker) return;

    startTransition(() => {
      setCurrentPrice(0);
      setImpliedPricePE(0);
      setImpliedPriceEvEbitda(0);
    });

    // Read implied prices written by comps page
    try {
      const stored = localStorage.getItem(`er:rel-val:${selectedTicker}`);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          impliedPricePE?: number;
          impliedPriceEvEbitda?: number;
        };
        startTransition(() => {
          setImpliedPricePE(parsed.impliedPricePE ?? 0);
          setImpliedPriceEvEbitda(parsed.impliedPriceEvEbitda ?? 0);
        });
      }
    } catch {
      // ignore parse errors
    }

    // Fetch live current price + company name
    fetch(`/api/quote/${selectedTicker}`)
      .then((r) => r.json())
      .then((d: { stock?: { price: number; name?: string } }) => {
        startTransition(() => {
          setCurrentPrice(d.stock?.price ?? 0);
          if (d.stock?.name) setSelectedName(d.stock.name);
        });
      })
      .catch(() => {
        startTransition(() => setCurrentPrice(0));
      });
  }, [selectedTicker]);

  function handleSelect(ticker: string, name: string) {
    startTransition(() => {
      setSelectedTicker(ticker);
      if (name) setSelectedName(name);
    });
  }

  // Restore a research set as the active working set and navigate to /comps
  const handleOpenComps = useCallback((set: ResearchSet) => {
    const ws: WorkingSet = {
      anchorTicker: set.anchorTicker,
      compTickers: set.compTickers,
    };
    try {
      localStorage.setItem("er:working-set", JSON.stringify(ws));
    } catch {
      // ignore quota errors
    }
    router.push("/comps");
  }, [router]);

  // Research sets linked to the current ticker
  const linkedSets = researchSets.filter(
    (s) => s.anchorTicker === selectedTicker
  );

  return (
    <>
      {/* Ticker search */}
      <div className="mb-5">
        <TickerSearch
          currentTicker={selectedTicker}
          watchlist={watchlist}
          onSelect={handleSelect}
        />
        {selectedTicker && (
          <p className="mt-1.5 text-sm font-mono font-semibold" style={{ color: "var(--blue)" }}>
            {selectedTicker}
            {selectedName && (
              <span className="ml-2 font-sans font-normal text-xs" style={{ color: "var(--text-muted)" }}>
                {selectedName}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Linked research sets */}
      {selectedTicker && linkedSets.length > 0 && (
        <div
          className="mb-5 rounded-lg border p-4"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <p
            className="mb-3 text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Research Sets — {selectedTicker}
          </p>
          <div className="flex flex-col gap-2">
            {linkedSets.map((set) => (
              <div
                key={set.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded border px-3 py-2"
                style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {set.name}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {set.compTickers.length} peers · {new Date(set.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/research/${set.id}`}
                    className="rounded border px-2.5 py-1 text-xs transition-colors hover:bg-zinc-700"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleOpenComps(set)}
                    className="rounded border px-2.5 py-1 text-xs transition-colors hover:bg-zinc-700"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    Open Comps →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thesis editor + checklist */}
      {selectedTicker ? (
        <div className="flex flex-col gap-5">
          <ThesisEditor
            note={note}
            onSave={save}
            currentPrice={currentPrice}
            impliedPricePE={impliedPricePE}
            impliedPriceEvEbitda={impliedPriceEvEbitda}
          />
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
          Enter a ticker above to get started.
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
          Document your investment thesis and track model build progress for any ticker.
        </p>
      </div>

      <Suspense fallback={null}>
        <ThesisContent />
      </Suspense>
    </div>
  );
}
