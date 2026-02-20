"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import type { Stock, CompsRow, ThesisNote, ChecklistItem } from "./types";

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Phase 1 – Context
  { id: "ctx-1", label: "Market cycle analysis", done: false },
  { id: "ctx-2", label: "Macro environment review", done: false },
  { id: "ctx-3", label: "Sector overview", done: false },
  // Phase 2 – Positioning
  { id: "pos-1", label: "Define comp group", done: false },
  { id: "pos-2", label: "Select anchor stock", done: false },
  { id: "pos-3", label: "Identify competitive positioning", done: false },
  // Phase 3 – Financial Foundation
  { id: "fin-1", label: "Income statement analysis", done: false },
  { id: "fin-2", label: "Balance sheet analysis", done: false },
  { id: "fin-3", label: "Cash flow statement analysis", done: false },
  // Phase 4 – Valuation
  { id: "val-1", label: "Forecast revenue and margins", done: false },
  { id: "val-2", label: "Build DCF model", done: false },
  { id: "val-3", label: "Cross-check with comps", done: false },
  { id: "val-4", label: "Sensitivity analysis", done: false },
  // Phase 5 – Conclusion
  { id: "con-1", label: "Target price", done: false },
  { id: "con-2", label: "Risk/reward summary", done: false },
  { id: "con-3", label: "Final investment report", done: false },
];

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private mode
  }
}

// ---------------------------------------------------------------------------
// useCustomStocks
// ---------------------------------------------------------------------------
export function useCustomStocks() {
  const [customStocks, setCustomStocks] = useState<Stock[]>([]);

  useEffect(() => {
    startTransition(() => {
      setCustomStocks(readStorage<Stock[]>("er:custom-stocks", []));
    });
  }, []);

  const persist = useCallback((next: Stock[]) => {
    setCustomStocks(next);
    writeStorage("er:custom-stocks", next);
  }, []);

  const addCustomStock = useCallback(
    (stock: Stock) => {
      if (customStocks.find((s) => s.ticker === stock.ticker)) return;
      persist([...customStocks, stock]);
    },
    [customStocks, persist]
  );

  const removeCustomStock = useCallback(
    (ticker: string) => {
      persist(customStocks.filter((s) => s.ticker !== ticker));
    },
    [customStocks, persist]
  );

  const clearCustomStocks = useCallback(() => {
    persist([]);
  }, [persist]);

  return { customStocks, addCustomStock, removeCustomStock, clearCustomStocks };
}

// ---------------------------------------------------------------------------
// useWatchlist
// ---------------------------------------------------------------------------
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    startTransition(() => {
      setWatchlist(readStorage<string[]>("er:watchlist", []));
    });
  }, []);

  const persist = useCallback((next: string[]) => {
    setWatchlist(next);
    writeStorage("er:watchlist", next);
  }, []);

  const add = useCallback(
    (ticker: string) => {
      const t = ticker.toUpperCase();
      persist(watchlist.includes(t) ? watchlist : [...watchlist, t]);
    },
    [watchlist, persist]
  );

  const remove = useCallback(
    (ticker: string) => {
      const t = ticker.toUpperCase();
      persist(watchlist.filter((x) => x !== t));
    },
    [watchlist, persist]
  );

  const toggle = useCallback(
    (ticker: string) => {
      const t = ticker.toUpperCase();
      persist(
        watchlist.includes(t)
          ? watchlist.filter((x) => x !== t)
          : [...watchlist, t]
      );
    },
    [watchlist, persist]
  );

  return { watchlist, add, remove, toggle };
}

// ---------------------------------------------------------------------------
// useCompsTable
// ---------------------------------------------------------------------------
export function useCompsTable() {
  const [rows, setRows] = useState<CompsRow[]>([]);

  useEffect(() => {
    startTransition(() => {
      setRows(readStorage<CompsRow[]>("er:comps", []));
    });
  }, []);

  const persist = useCallback((next: CompsRow[]) => {
    setRows(next);
    writeStorage("er:comps", next);
  }, []);

  const addRow = useCallback(
    (row: CompsRow) => {
      if (rows.find((r) => r.ticker === row.ticker)) return;
      persist([...rows, row]);
    },
    [rows, persist]
  );

  const removeRow = useCallback(
    (ticker: string) => {
      persist(rows.filter((r) => r.ticker !== ticker));
    },
    [rows, persist]
  );

  const reorder = useCallback(
    (from: number, to: number) => {
      const next = [...rows];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      persist(next);
    },
    [rows, persist]
  );

  return { rows, addRow, removeRow, reorder };
}

// ---------------------------------------------------------------------------
// useThesis
// ---------------------------------------------------------------------------
export function useThesis(ticker: string) {
  const key = `er:thesis:${ticker.toUpperCase()}`;

  const empty: ThesisNote = {
    ticker: ticker.toUpperCase(),
    bull: "",
    bear: "",
    catalysts: "",
    risks: "",
    targetPrice: "",
    checklist: DEFAULT_CHECKLIST.map((item) => ({ ...item })),
    competitiveAdvantage: "",
    catalyst: "",
    valuation: "",
    managementQuality: "",
    psychology: "",
  };

  const [note, setNote] = useState<ThesisNote>(empty);

  useEffect(() => {
    if (!ticker) return;
    const stored = readStorage<ThesisNote | null>(key, null);
    startTransition(() => {
      if (stored) {
        // If stored checklist uses old numeric IDs, reset to new phase-based checklist
        const hasLegacyIds = stored.checklist.length > 0 && stored.checklist.every((c) => /^\d+$/.test(c.id));
        const checklist = hasLegacyIds
          ? DEFAULT_CHECKLIST.map((item) => ({ ...item }))
          : (() => {
              const storedIds = new Set(stored.checklist.map((c) => c.id));
              return [
                ...stored.checklist,
                ...DEFAULT_CHECKLIST.filter((d) => !storedIds.has(d.id)),
              ];
            })();
        setNote({
          ...empty,
          ...stored,
          checklist,
        });
      } else {
        setNote(empty);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  const save = useCallback(
    (updated: ThesisNote) => {
      setNote(updated);
      writeStorage(key, updated);
    },
    [key]
  );

  return { note, save };
}
