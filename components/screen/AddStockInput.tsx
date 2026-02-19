"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import type { Stock } from "@/lib/types";

interface AddStockInputProps {
  existingTickers: string[];
  onAdd: (stock: Stock) => void;
}

export default function AddStockInput({ existingTickers, onAdd }: AddStockInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleAdd() {
    const t = value.trim().toUpperCase();
    if (!t) return;

    if (existingTickers.includes(t)) {
      setError(`${t} is already in the table.`);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/quote/${t}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? `"${t}" not found. Check the symbol and try again.`);
        return;
      }

      if (!data.stock) {
        setError(`No data returned for "${t}".`);
        return;
      }

      onAdd(data.stock as Stock);
      setValue("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") {
      setValue("");
      setError("");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
          Add ticker to universe
        </span>
        <input
          type="text"
          placeholder="e.g. ASML, TSM"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setError("");
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="w-36 rounded border px-2.5 py-1.5 font-mono text-sm uppercase focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
          spellCheck={false}
        />
        <Button variant="primary" size="sm" onClick={handleAdd} disabled={isLoading}>
          {isLoading ? "…" : "Add"}
        </Button>
      </div>
      {error && (
        <p className="text-xs" style={{ color: "var(--red)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
