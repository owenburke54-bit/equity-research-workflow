"use client";

import Link from "next/link";
import { useEffect, useState, startTransition } from "react";
import Button from "@/components/ui/Button";

const STAGES = [
  {
    href: "/screen",
    icon: "⬛",
    title: "Screen",
    description:
      "Define your investable universe and identify potential anchors. Filter by sector and size, inspect valuation dispersion, and select a company to begin structured analysis.",
    storageKey: "er:watchlist",
    statLabel: "watchlisted",
    countFn: (raw: string) => (JSON.parse(raw) as string[]).length,
    ctaLabel: "Open Screener",
  },
  {
    href: "/comps",
    icon: "▦",
    title: "Comps",
    description:
      "Build a comparable companies table. Add tickers, inspect trading multiples, and view median benchmarks.",
    storageKey: "er:comps",
    statLabel: "tickers in table",
    countFn: (raw: string) =>
      (JSON.parse(raw) as unknown[]).length,
    ctaLabel: "Open Comps",
  },
  {
    href: "/thesis",
    icon: "✎",
    title: "Thesis",
    description:
      "Write bull / bear cases, log catalysts and risks, set a target price, and track your model build checklist.",
    storageKey: null,
    statLabel: null,
    countFn: null,
    ctaLabel: "Open Thesis",
  },
];

function useStorageCount(key: string | null, countFn: ((raw: string) => number) | null) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!key || !countFn) return;
    startTransition(() => {
      try {
        const raw = localStorage.getItem(key);
        setCount(raw ? countFn(raw) : 0);
      } catch {
        setCount(0);
      }
    });
  }, [key, countFn]);
  return count;
}

function StageCard({
  href,
  icon,
  title,
  description,
  storageKey,
  statLabel,
  countFn,
  ctaLabel,
}: (typeof STAGES)[number]) {
  const count = useStorageCount(storageKey, countFn);

  return (
    <div
      className="flex flex-col gap-4 rounded-lg border p-6"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
        {count !== null && statLabel && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {count} {statLabel}
          </span>
        )}
      </div>
      <div>
        <h2
          className="mb-1 text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      </div>
      <div className="mt-auto">
        <Link href={href}>
          <Button variant="primary" size="sm">
            {ctaLabel} →
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-16 text-center">
        <h1
          className="text-5xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Intrinsic
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {STAGES.map((stage) => (
          <StageCard key={stage.href} {...stage} />
        ))}
      </div>
    </div>
  );
}
