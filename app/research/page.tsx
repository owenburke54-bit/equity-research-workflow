"use client";

import Link from "next/link";
import { useResearchSets } from "@/lib/working-set";

export default function ResearchPage() {
  const { sets, deleteSet, hydrated } = useResearchSets();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Research Sets
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Saved comps tables with thesis notes.
          </p>
        </div>
        <Link
          href="/screen"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          + New Research
        </Link>
      </div>

      {!hydrated ? null : sets.length === 0 ? (
        <div
          className="rounded-lg border p-12 text-center text-sm"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <p className="mb-4">No saved research sets yet.</p>
          <p>
            Select a stock in the{" "}
            <Link href="/screen" className="underline" style={{ color: "var(--blue)" }}>
              Screener
            </Link>
            , generate comps, then click &ldquo;Save Research Set&rdquo;.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sets.map((set) => (
            <div
              key={set.id}
              className="rounded-lg border p-5 transition-colors hover:border-zinc-600"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/research/${set.id}`}
                    className="text-base font-semibold hover:underline"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {set.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>
                      Anchor:{" "}
                      <span className="font-mono font-semibold" style={{ color: "var(--blue)" }}>
                        {set.anchorTicker}
                      </span>
                    </span>
                    <span>·</span>
                    <span>{set.compTickers.length} peers</span>
                    <span>·</span>
                    <span>{set.compsSnapshot.length} rows</span>
                    <span>·</span>
                    <span>{new Date(set.createdAt).toLocaleDateString()}</span>
                  </div>
                  {set.thesis && (
                    <p
                      className="mt-2 text-xs line-clamp-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {set.thesis.bull || set.thesis.bear || "Thesis saved"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/research/${set.id}`}
                    className="rounded border px-3 py-1 text-xs transition-colors hover:bg-zinc-700"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    View
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${set.name}"?`)) deleteSet(set.id);
                    }}
                    className="rounded border px-3 py-1 text-xs transition-colors hover:bg-red-900/30 hover:border-red-700"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
