"use client";

interface SelectionBarProps {
  ticker: string;
  onGenerate: () => void;
  onClear: () => void;
}

export default function SelectionBar({ ticker, onGenerate, onClear }: SelectionBarProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between px-6 py-3 shadow-lg"
      style={{
        background: "var(--bg-elevated)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="text-sm font-mono font-semibold"
          style={{ color: "var(--blue)" }}
        >
          {ticker}
        </span>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          selected as anchor
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onClear}
          className="rounded px-3 py-1.5 text-sm transition-colors hover:bg-zinc-700"
          style={{ color: "var(--text-muted)" }}
        >
          Clear
        </button>
        <button
          onClick={onGenerate}
          className="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Generate comps →
        </button>
      </div>
    </div>
  );
}
