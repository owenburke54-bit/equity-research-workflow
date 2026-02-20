"use client";

import type { ChecklistItem, ThesisNote } from "@/lib/types";

interface ModelChecklistProps {
  note: ThesisNote;
  onSave: (updated: ThesisNote) => void;
}

const PHASES = [
  {
    label: "Phase 1 – Context",
    ids: ["ctx-1", "ctx-2", "ctx-3"],
  },
  {
    label: "Phase 2 – Positioning",
    ids: ["pos-1", "pos-2", "pos-3"],
  },
  {
    label: "Phase 3 – Financial Foundation",
    ids: ["fin-1", "fin-2", "fin-3"],
  },
  {
    label: "Phase 4 – Valuation",
    ids: ["val-1", "val-2", "val-3", "val-4"],
  },
  {
    label: "Phase 5 – Conclusion",
    ids: ["con-1", "con-2", "con-3"],
  },
];

export default function ModelChecklist({ note, onSave }: ModelChecklistProps) {
  function toggleItem(id: string) {
    const updated: ThesisNote = {
      ...note,
      checklist: note.checklist.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    };
    onSave(updated);
  }

  const itemMap = new Map(note.checklist.map((c) => [c.id, c]));
  const done = note.checklist.filter((c) => c.done).length;
  const total = note.checklist.length;

  return (
    <div
      className="rounded-lg border p-5"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Research Checklist
        </h2>
        <span className="text-xs" style={{ color: done === total ? "var(--green)" : "var(--text-muted)" }}>
          Model Progress: {done} / {total} ({total > 0 ? Math.round((done / total) * 100) : 0}%)
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="mb-5 h-1 w-full overflow-hidden rounded-full"
        style={{ background: "var(--bg-elevated)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${total > 0 ? (done / total) * 100 : 0}%`,
            background: done === total ? "var(--green)" : "var(--blue)",
          }}
        />
      </div>

      <div className="flex flex-col gap-5">
        {PHASES.map((phase) => {
          const items = phase.ids
            .map((id) => itemMap.get(id))
            .filter((item): item is ChecklistItem => item !== undefined);
          if (items.length === 0) return null;
          return (
            <div key={phase.label}>
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                {phase.label}
              </p>
              <ul className="flex flex-col gap-2">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`check-${item.id}`}
                      checked={item.done}
                      onChange={() => toggleItem(item.id)}
                      className="h-4 w-4 cursor-pointer rounded accent-blue-500"
                    />
                    <label
                      htmlFor={`check-${item.id}`}
                      className="cursor-pointer select-none text-sm"
                      style={{ color: item.done ? "var(--text-muted)" : "var(--text-secondary)" }}
                    >
                      <span className={item.done ? "line-through" : ""}>{item.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
