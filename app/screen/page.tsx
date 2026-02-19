"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SECTOR_LIST } from "@/lib/stock-universe";
import { useWatchlist, useCustomStocks } from "@/lib/storage";
import FilterBar, { type Filters } from "@/components/screen/FilterBar";
import StockTable from "@/components/screen/StockTable";
import SelectionBar from "@/components/screen/SelectionBar";
import AddStockInput from "@/components/screen/AddStockInput";
import type { Stock, WorkingSet } from "@/lib/types";

function applyFilters(stocks: Stock[], filters: Filters, watchlist: string[]): Stock[] {
  let result = stocks.map((s) => ({
    ...s,
    isWatchlisted: watchlist.includes(s.ticker),
  }));

  if (!filters.showIncomplete) {
    result = result.filter((s) => s.price > 0 && s.marketCap > 0);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    );
  }

  if (filters.sector !== "all") {
    result = result.filter((s) => s.sector === filters.sector);
  }

  if (filters.marketCap === "mega")  result = result.filter((s) => s.marketCap > 200);
  else if (filters.marketCap === "large") result = result.filter((s) => s.marketCap >= 10 && s.marketCap <= 200);
  else if (filters.marketCap === "mid")  result = result.filter((s) => s.marketCap >= 2 && s.marketCap < 10);
  else if (filters.marketCap === "small") result = result.filter((s) => s.marketCap > 0 && s.marketCap < 2);

  result.sort((a, b) => {
    const key = filters.sortBy;
    const av = a[key] as number | string;
    const bv = b[key] as number | string;
    if (typeof av === "string") {
      return filters.sortDir === "asc"
        ? av.localeCompare(bv as string)
        : (bv as string).localeCompare(av);
    }
    return filters.sortDir === "asc"
      ? (av as number) - (bv as number)
      : (bv as number) - (av as number);
  });

  return result;
}

function generateComps(anchor: string, rawStocks: Stock[]): WorkingSet {
  const anchorStock = rawStocks.find((s) => s.ticker === anchor)!;
  const byCap = (s: Stock) => Math.abs(s.marketCap - anchorStock.marketCap);

  const sameSector = rawStocks
    .filter((s) => s.ticker !== anchor && s.sector === anchorStock.sector && s.marketCap > 0)
    .sort((a, b) => byCap(a) - byCap(b));

  let comps = sameSector.slice(0, 7);

  if (comps.length < 6) {
    const used = new Set([anchor, ...comps.map((s) => s.ticker)]);
    const fillers = rawStocks
      .filter((s) => !used.has(s.ticker) && s.marketCap > 0)
      .sort((a, b) => byCap(a) - byCap(b))
      .slice(0, 6 - comps.length);
    comps = [...comps, ...fillers];
  }

  return { anchorTicker: anchor, compTickers: comps.map((s) => s.ticker) };
}

export default function ScreenPage() {
  const router = useRouter();
  const { watchlist, toggle } = useWatchlist();
  const { customStocks, addCustomStock } = useCustomStocks();
  const [filters, setFilters] = useState<Filters>({
    sector: "all",
    marketCap: "all",
    sortBy: "marketCap",
    sortDir: "desc",
    search: "",
    showIncomplete: false,
  });
  const [selectedTicker, setSelectedTicker] = useState<string>("");

  const rawStocks = customStocks;

  const stocks = useMemo(
    () => applyFilters(rawStocks, filters, watchlist),
    [rawStocks, filters, watchlist]
  );

  const completeCount = useMemo(
    () => rawStocks.filter((s) => s.price > 0 && s.marketCap > 0).length,
    [rawStocks]
  );

  const handleAddStock = useCallback(
    (stock: Stock) => addCustomStock(stock),
    [addCustomStock]
  );

  const handleGenerate = useCallback(() => {
    if (!selectedTicker || rawStocks.length === 0) return;
    const ws = generateComps(selectedTicker, rawStocks);
    try {
      localStorage.setItem("er:working-set", JSON.stringify(ws));
    } catch {
      // quota exceeded or private mode
    }
    router.push("/comps");
  }, [selectedTicker, rawStocks, router]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8" style={{ paddingBottom: selectedTicker ? "5rem" : undefined }}>
      <div className="mb-6 flex flex-col gap-1">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Screener
        </h1>
        {rawStocks.length > 0 && (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {`${stocks.length} shown · ${completeCount}/${rawStocks.length} with complete data · ${watchlist.length} watchlisted · click a row to select anchor`}
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-start gap-4">
        <FilterBar filters={filters} onChange={setFilters} sectors={SECTOR_LIST} />
        <AddStockInput
          existingTickers={rawStocks.map((s) => s.ticker)}
          onAdd={handleAddStock}
        />
      </div>

      {rawStocks.length === 0 ? (
        <div
          className="rounded-lg border p-16 text-center"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <p className="mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Your universe is empty
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Type a ticker above to add stocks from Yahoo Finance.
          </p>
        </div>
      ) : (
        <StockTable
          stocks={stocks}
          watchlist={watchlist}
          onToggleWatchlist={toggle}
          selectedTicker={selectedTicker}
          onSelect={(ticker) =>
            setSelectedTicker((prev) => (prev === ticker ? "" : ticker))
          }
        />
      )}

      {selectedTicker && (
        <SelectionBar
          ticker={selectedTicker}
          onGenerate={handleGenerate}
          onClear={() => setSelectedTicker("")}
        />
      )}
    </div>
  );
}
