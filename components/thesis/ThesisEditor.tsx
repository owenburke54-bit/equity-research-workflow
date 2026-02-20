"use client";

import type { ThesisNote } from "@/lib/types";

interface ThesisEditorProps {
  note: ThesisNote;
  onSave: (updated: ThesisNote) => void;
  currentPrice?: number;
  impliedPricePE?: number;
  impliedPriceEvEbitda?: number;
}

const textareaClass =
  "w-full rounded border px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-blue-500/50";
const textareaStyle = {
  background: "var(--bg-elevated)",
  borderColor: "var(--border)",
  color: "var(--text-primary)",
  minHeight: "80px",
};

const labelClass = "block mb-1 text-xs font-medium";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass} style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <textarea
        className={textareaClass}
        style={textareaStyle}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function ThesisEditor({
  note,
  onSave,
  currentPrice = 0,
  impliedPricePE = 0,
  impliedPriceEvEbitda = 0,
}: ThesisEditorProps) {
  function update(key: keyof ThesisNote, value: string) {
    onSave({ ...note, [key]: value });
  }

  const showStrip = currentPrice > 0;
  const peUpside = impliedPricePE > 0 ? (impliedPricePE / currentPrice - 1) * 100 : null;
  const evUpside = impliedPriceEvEbitda > 0 ? (impliedPriceEvEbitda / currentPrice - 1) * 100 : null;

  return (
    <div
      className="rounded-lg border p-5"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {note.ticker || "Select a ticker"} — Investment Memo
      </h2>

      {/* Valuation strip */}
      {showStrip && (impliedPricePE > 0 || impliedPriceEvEbitda > 0) && (
        <div
          className="mb-4 rounded border p-3"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          {/* P/E row */}
          {peUpside !== null && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span style={{ color: "var(--text-muted)" }}>Current:</span>
              <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                ${currentPrice.toFixed(2)}
              </span>
              <span style={{ color: "var(--text-muted)" }}>Implied (P/E):</span>
              <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                ${impliedPricePE.toFixed(2)}
              </span>
              <span
                className="font-semibold"
                style={{ color: peUpside >= 0 ? "#22c55e" : "#ef4444" }}
              >
                {peUpside >= 0 ? "▲" : "▼"} {peUpside >= 0 ? "+" : ""}{peUpside.toFixed(1)}%
              </span>
              <button
                onClick={() => update("targetPrice", impliedPricePE.toFixed(2))}
                className="ml-auto rounded border px-2 py-0.5 text-xs transition-colors hover:bg-zinc-700"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Use P/E price →
              </button>
            </div>
          )}

          {/* Progress bar */}
          {peUpside !== null && (
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full"
              style={{ background: "var(--bg-base)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(Math.abs(peUpside) / 50 * 100, 100)}%`,
                  background: peUpside >= 0 ? "#22c55e" : "#ef4444",
                }}
              />
            </div>
          )}

          {/* EV/EBITDA secondary line */}
          {evUpside !== null && impliedPriceEvEbitda !== impliedPricePE && (
            <div
              className="mt-2 flex flex-wrap items-center gap-3 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <span>Implied (EV/EBITDA):</span>
              <span className="font-mono font-semibold" style={{ color: "var(--text-secondary)" }}>
                ${impliedPriceEvEbitda.toFixed(2)}
              </span>
              <span
                className="font-semibold"
                style={{ color: evUpside >= 0 ? "#22c55e" : "#ef4444" }}
              >
                {evUpside >= 0 ? "+" : ""}{evUpside.toFixed(1)}%
              </span>
              <button
                onClick={() => update("targetPrice", impliedPriceEvEbitda.toFixed(2))}
                className="rounded border px-1.5 py-0.5 transition-colors hover:bg-zinc-700"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                Use →
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Bull Case"
          value={note.bull}
          onChange={(v) => update("bull", v)}
          placeholder="Why is this a buy? Core upside drivers..."
        />
        <Field
          label="Bear Case"
          value={note.bear}
          onChange={(v) => update("bear", v)}
          placeholder="What could go wrong? Key downside risks..."
        />
        <Field
          label="Catalysts"
          value={note.catalysts}
          onChange={(v) => update("catalysts", v)}
          placeholder="Upcoming events, product launches, earnings..."
        />
        <Field
          label="Key Risks"
          value={note.risks}
          onChange={(v) => update("risks", v)}
          placeholder="Regulatory, competitive, macro risks..."
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Target Price ($)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-32 rounded border px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
          value={note.targetPrice}
          onChange={(e) => update("targetPrice", e.target.value)}
          placeholder="0.00"
        />
      </div>

      <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
        Changes are saved automatically to LocalStorage.
      </p>
    </div>
  );
}
