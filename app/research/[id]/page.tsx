"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { useResearchSets } from "@/lib/working-set";
import CompsTable from "@/components/comps/CompsTable";

export default function ResearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { sets, saveSet, hydrated } = useResearchSets();
  const [assumptions, setAssumptions] = useState<string | null>(null);

  const set = sets.find((s) => s.id === id);

  const handleAssumptionsBlur = useCallback(() => {
    if (!set) return;
    if (assumptions === null || assumptions === set.assumptions) return;
    saveSet({ ...set, assumptions });
  }, [assumptions, set, saveSet]);

  // Wait for hydration before showing not-found
  if (!hydrated) return null;

  if (!set) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div
          className="rounded-lg border p-12 text-center text-sm"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <p className="mb-4">Research set not found.</p>
          <Link href="/research" className="underline" style={{ color: "var(--blue)" }}>
            ← Back to Research
          </Link>
        </div>
      </div>
    );
  }

  const currentAssumptions = assumptions ?? set.assumptions;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 print:px-0 print:py-0">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 print:hidden">
        <Link href="/research" className="text-xs hover:underline" style={{ color: "var(--text-muted)" }}>
          ← Research Sets
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded border px-3 py-1.5 text-sm transition-colors hover:bg-zinc-700"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          Print / PDF
        </button>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {set.name}
        </h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
          <span>
            Anchor:{" "}
            <span className="font-mono font-semibold" style={{ color: "var(--blue)" }}>
              {set.anchorTicker}
            </span>
          </span>
          <span>·</span>
          <span>{set.compTickers.length} peers</span>
          <span>·</span>
          <span>Saved {new Date(set.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
      </div>

      {/* Comps snapshot */}
      <section className="mb-8">
        <h2
          className="mb-3 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Comps Snapshot
        </h2>
        <CompsTable
          rows={set.compsSnapshot}
          onRemove={() => {}}
          anchorTicker={set.anchorTicker}
        />
      </section>

      {/* Thesis */}
      {set.thesis && (
        <section className="mb-8">
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Investment Thesis
          </h2>
          <div
            className="rounded-lg border p-5 grid gap-4 md:grid-cols-2"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {[
              { label: "Bull Case", value: set.thesis.bull },
              { label: "Bear Case", value: set.thesis.bear },
              { label: "Catalysts", value: set.thesis.catalysts },
              { label: "Risks", value: set.thesis.risks },
            ].map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                    {value}
                  </p>
                </div>
              ) : null
            )}
            {set.thesis.targetPrice && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Target Price
                </p>
                <p className="text-sm font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                  {set.thesis.targetPrice}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Assumptions (editable) */}
      <section className="mb-8">
        <h2
          className="mb-3 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Assumptions &amp; Notes
        </h2>
        <textarea
          value={currentAssumptions}
          onChange={(e) => setAssumptions(e.target.value)}
          onBlur={handleAssumptionsBlur}
          placeholder="Add your key assumptions, model notes, or research observations here…"
          rows={6}
          className="w-full rounded-lg border p-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 print:border-none print:p-0"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
            resize: "vertical",
          }}
        />
      </section>

      {/* Checklist */}
      {set.thesis && set.thesis.checklist.length > 0 && (
        <section className="mb-8">
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Model Checklist
          </h2>
          <div
            className="rounded-lg border p-5"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <ul className="flex flex-col gap-2">
              {set.thesis.checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="text-base"
                    style={{ color: item.done ? "var(--green)" : "var(--text-muted)" }}
                  >
                    {item.done ? "✓" : "○"}
                  </span>
                  <span style={{ color: item.done ? "var(--text-secondary)" : "var(--text-muted)" }}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
