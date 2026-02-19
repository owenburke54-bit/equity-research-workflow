"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import type { Stock, CompsRow, ThesisNote, ChecklistItem } from "./types";

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "1", label: "Download 10-K / 20-F", done: false },
  { id: "2", label: "Download latest 10-Q", done: false },
  { id: "3", label: "Read MD&A section", done: false },
  { id: "4", label: "Build revenue model (segments)", done: false },
  { id: "5", label: "Model EBITDA bridge", done: false },
  { id: "6", label: "Forecast FCF 3–5 years", done: false },
  { id: "7", label: "Run DCF valuation", done: false },
  { id: "8", label: "Pull comps and size trading multiples", done: false },
  { id: "9", label: "Review sell-side consensus estimates", done: false },
  { id: "10", label: "Document key risks & mitigants", done: false },
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
  };

  const [note, setNote] = useState<ThesisNote>(empty);

  useEffect(() => {
    if (!ticker) return;
    const stored = readStorage<ThesisNote | null>(key, null);
    startTransition(() => {
      if (stored) {
        // Merge stored checklist with any new default items
        const storedIds = new Set(stored.checklist.map((c) => c.id));
        const merged = [
          ...stored.checklist,
          ...DEFAULT_CHECKLIST.filter((d) => !storedIds.has(d.id)),
        ];
        setNote({ ...stored, checklist: merged });
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
