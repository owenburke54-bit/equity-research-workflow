import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { UNIVERSE_MAP } from "@/lib/stock-universe";
import type { Stock, CompsRow } from "@/lib/types";

const yf = new YahooFinance();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const sym = ticker.toUpperCase();

  try {
    const result = await yf.quoteSummary(sym, {
      modules: ["price", "financialData", "defaultKeyStatistics", "assetProfile", "summaryDetail"],
    });

    const p = result.price;
    const fin = result.financialData;
    const stats = result.defaultKeyStatistics;
    const profile = result.assetProfile;
    const sd = result.summaryDetail;

    const marketCapB = (p?.marketCap ?? 0) / 1e9;
    const evB = (stats?.enterpriseValue ?? 0) / 1e9;
    const revenueB = (fin?.totalRevenue ?? 0) / 1e9;
    const ebitdaB = (fin?.ebitda ?? 0) / 1e9;
    // trailingPE lives in summaryDetail, not price
    const peRatio = sd?.trailingPE ?? 0;
    // revenueGrowth: quarterly YoY (most recent quarter vs. same quarter prior year)
    const revenueGrowth = (fin?.revenueGrowth ?? 0) * 100;
    // grossMargins: TTM gross margin as decimal → multiply by 100
    const grossMargin = (fin?.grossMargins ?? 0) * 100;
    // trailingEps: TTM diluted EPS
    const eps = stats?.trailingEps ?? 0;

    const compsRow: CompsRow = {
      ticker: sym,
      name: p?.shortName ?? p?.longName ?? sym,
      marketCap: marketCapB,
      ev: evB,
      revenue: revenueB,
      ebitda: ebitdaB,
      revenueGrowth,
      grossMargin,
      eps,
      peRatio,
      evEbitda: stats?.enterpriseToEbitda ?? 0,
      evRevenue: stats?.enterpriseToRevenue ?? 0,
    };

    const universalEntry = UNIVERSE_MAP.get(sym);
    const stock: Stock = {
      ticker: sym,
      name: p?.shortName ?? p?.longName ?? sym,
      sector: profile?.sector ?? universalEntry?.sector ?? "Unknown",
      price: p?.regularMarketPrice ?? 0,
      // quoteSummary price.regularMarketChangePercent is a decimal fraction (0.0082 = +0.82%)
      change1d: (p?.regularMarketChangePercent ?? 0) * 100,
      marketCap: marketCapB,
      peRatio,
      pbRatio: stats?.priceToBook ?? 0,
      evEbitda: stats?.enterpriseToEbitda ?? 0,
      revenueGrowthYoY: (fin?.revenueGrowth ?? 0) * 100,
      ebitdaMargin: (fin?.ebitdaMargins ?? 0) * 100,
      isWatchlisted: false,
    };

    return NextResponse.json({ stock, compsRow, live: true });
  } catch (err) {
    console.error(`Yahoo Finance quoteSummary failed for ${sym}:`, err);
    return NextResponse.json(
      { error: `Could not fetch data for "${sym}". Check the symbol and try again.` },
      { status: 404 }
    );
  }
}
