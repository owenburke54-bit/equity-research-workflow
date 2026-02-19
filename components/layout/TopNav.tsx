"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/screen", label: "Screen" },
  { href: "/comps", label: "Comps" },
  { href: "/thesis", label: "Thesis" },
  { href: "/research", label: "Research" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b px-6"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
    >
      <Link
        href="/"
        className="mr-8 text-sm font-semibold tracking-wide"
        style={{ color: "var(--text-primary)" }}
      >
        Equity Research
      </Link>

      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
