"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import type { WorkingSet, ResearchSet } from "./types";

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
// useWorkingSet
// ---------------------------------------------------------------------------
export function useWorkingSet() {
  const [ws, setWs] = useState<WorkingSet | null>(null);

  useEffect(() => {
    startTransition(() => {
      setWs(readStorage<WorkingSet | null>("er:working-set", null));
    });
  }, []);

  const save = useCallback((next: WorkingSet) => {
    setWs(next);
    writeStorage("er:working-set", next);
  }, []);

  const addComp = useCallback(
    (ticker: string) => {
      if (!ws) return;
      if (ticker === ws.anchorTicker) return;
      if (ws.compTickers.includes(ticker)) return;
      save({ ...ws, compTickers: [...ws.compTickers, ticker] });
    },
    [ws, save]
  );

  const removeComp = useCallback(
    (ticker: string) => {
      if (!ws) return;
      save({ ...ws, compTickers: ws.compTickers.filter((t) => t !== ticker) });
    },
    [ws, save]
  );

  return { ws, save, addComp, removeComp };
}

// ---------------------------------------------------------------------------
// useResearchSets
// ---------------------------------------------------------------------------
export function useResearchSets() {
  const [sets, setSets] = useState<ResearchSet[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setSets(readStorage<ResearchSet[]>("er:research-sets", []));
      setHydrated(true);
    });
  }, []);

  const persist = useCallback((next: ResearchSet[]) => {
    setSets(next);
    writeStorage("er:research-sets", next);
  }, []);

  const saveSet = useCallback(
    (set: ResearchSet) => {
      const existing = sets.find((s) => s.id === set.id);
      if (existing) {
        persist(sets.map((s) => (s.id === set.id ? set : s)));
      } else {
        persist([set, ...sets]);
      }
    },
    [sets, persist]
  );

  const deleteSet = useCallback(
    (id: string) => {
      persist(sets.filter((s) => s.id !== id));
    },
    [sets, persist]
  );

  return { sets, saveSet, deleteSet, hydrated };
}
