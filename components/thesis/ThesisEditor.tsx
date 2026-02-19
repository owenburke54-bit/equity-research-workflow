"use client";

import type { ThesisNote } from "@/lib/types";

interface ThesisEditorProps {
  note: ThesisNote;
  onSave: (updated: ThesisNote) => void;
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

export default function ThesisEditor({ note, onSave }: ThesisEditorProps) {
  function update(key: keyof ThesisNote, value: string) {
    onSave({ ...note, [key]: value });
  }

  return (
    <div
      className="rounded-lg border p-5"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        Investment Thesis — {note.ticker || "Select a ticker"}
      </h2>

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
