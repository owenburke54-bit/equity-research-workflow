"use client";

import type { ChecklistItem, ThesisNote } from "@/lib/types";

interface ModelChecklistProps {
  note: ThesisNote;
  onSave: (updated: ThesisNote) => void;
}

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

  const done = note.checklist.filter((c) => c.done).length;
  const total = note.checklist.length;

  return (
    <div
      className="rounded-lg border p-5"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Model Build Checklist
        </h2>
        <span className="text-xs" style={{ color: done === total ? "var(--green)" : "var(--text-muted)" }}>
          Model Progress: {done} / {total} ({total > 0 ? Math.round((done / total) * 100) : 0}%)
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="mb-4 h-1 w-full overflow-hidden rounded-full"
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

      <ul className="flex flex-col gap-2">
        {note.checklist.map((item: ChecklistItem) => (
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
              className="cursor-pointer text-sm select-none"
              style={{ color: item.done ? "var(--text-muted)" : "var(--text-secondary)" }}
            >
              <span className={item.done ? "line-through" : ""}>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
