import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { STOCK_UNIVERSE, UNIVERSE_MAP } from "@/lib/stock-universe";
import type { Stock } from "@/lib/types";

const yf = new YahooFinance();

// Fetch fresh data every 5 minutes
export const revalidate = 300;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function GET() {
  const tickers = STOCK_UNIVERSE.map((s) => s.ticker);

  try {
    // Yahoo Finance handles ~200 symbols per call safely
    const batches = chunk(tickers, 200);
    const batchResults = await Promise.all(
      batches.map((batch) => yf.quote(batch, {}, { validateResult: false }))
    );
    const quotes = batchResults.flat() as Array<Record<string, unknown>>;
    const quoteMap = new Map(quotes.map((q) => [q.symbol as string, q]));

    const stocks: Stock[] = STOCK_UNIVERSE.map((entry) => {
      const live = quoteMap.get(entry.ticker);
      const base: Stock = {
        ticker: entry.ticker,
        name: entry.name,
        sector: entry.sector,
        price: 0,
        change1d: 0,
        marketCap: 0,
        peRatio: 0,
        pbRatio: 0,
        evEbitda: 0,
        revenueGrowthYoY: 0,
        ebitdaMargin: 0,
        isWatchlisted: false,
      };
      if (!live) return base;
      return {
        ...base,
        name: (live.shortName as string) ?? entry.name,
        // quote() regularMarketChangePercent is already a percentage (e.g. 0.82 = +0.82%)
        price: (live.regularMarketPrice as number) ?? 0,
        change1d: (live.regularMarketChangePercent as number) ?? 0,
        marketCap: live.marketCap != null ? (live.marketCap as number) / 1e9 : 0,
        peRatio: (live.trailingPE as number) ?? 0,
        pbRatio: (live.priceToBook as number) ?? 0,
      };
    });

    return NextResponse.json({ stocks, live: true, total: stocks.length });
  } catch (err) {
    console.error("Yahoo Finance batch quote failed:", err);

    // Fallback: return shell records with no price data
    const stocks: Stock[] = STOCK_UNIVERSE.map((entry) => ({
      ticker: entry.ticker,
      name: entry.name,
      sector: entry.sector,
      price: 0,
      change1d: 0,
      marketCap: 0,
      peRatio: 0,
      pbRatio: 0,
      evEbitda: 0,
      revenueGrowthYoY: 0,
      ebitdaMargin: 0,
      isWatchlisted: false,
    }));

    // Suppress unused import warning
    void UNIVERSE_MAP;

    return NextResponse.json({ stocks, live: false, total: stocks.length });
  }
}
