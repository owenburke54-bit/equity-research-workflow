"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/screen", label: "Screen" },
  { href: "/comps", label: "Comps" },
  { href: "/thesis", label: "Thesis" },
  { href: "/research", label: "Research" },
];

// Concentric-circle logomark — outer ring = market price, inner ring = intrinsic value
function Logomark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" stroke="#3b82f6" strokeWidth="0.75" strokeOpacity="0.35" />
      <circle cx="10" cy="10" r="4"   stroke="#3b82f6" strokeWidth="1.25" />
    </svg>
  );
}

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b px-6"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Logomark />
        <span
          className="text-sm font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Intrinsic
        </span>
      </Link>

      {/* Right side — nav + version badge */}
      <div className="flex items-center gap-5">
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                  active
                    ? "border border-blue-600/30 bg-blue-600/20 text-blue-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          v0.1
        </span>
      </div>
    </header>
  );
}
