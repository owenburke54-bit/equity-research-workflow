# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (v9 flat config)
```

No test framework is configured yet.

## Stack

- **Next.js 16** with App Router (server components by default)
- **React 19**
- **TypeScript** (strict mode, `@/*` path alias maps to project root)
- **Tailwind CSS v4** via PostCSS (`@import "tailwindcss"` in globals.css)

## Architecture

Uses the Next.js App Router pattern:

- `app/layout.tsx` — root layout; loads Geist fonts via `next/font`, sets metadata, exposes `--font-geist-sans` / `--font-geist-mono` CSS variables
- `app/page.tsx` — home route (`/`)
- `app/globals.css` — global styles; defines `--background` / `--foreground` CSS variables with automatic dark mode via `prefers-color-scheme`

All routes live under `app/`. API routes go in `app/api/`. Server Actions can be added to any server component or a dedicated `actions/` directory.
