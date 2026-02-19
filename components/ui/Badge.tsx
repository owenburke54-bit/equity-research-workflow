import React from "react";

type Variant = "green" | "red" | "neutral" | "blue";

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  green: "bg-green-900/30 text-green-400 border border-green-800/40",
  red: "bg-red-900/30 text-red-400 border border-red-800/40",
  neutral: "bg-zinc-800 text-zinc-300 border border-zinc-700",
  blue: "bg-blue-900/30 text-blue-400 border border-blue-800/40",
};

export default function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
