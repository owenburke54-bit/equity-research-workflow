import type { CompsRow } from "./types";
import { STOCK_UNIVERSE } from "./stock-universe";

// Fallback comps data used when Yahoo Finance is unavailable.
// Only the original 15 well-known tickers are pre-seeded here;
// the live route (app/api/quote/[ticker]) is the primary source.
const COMPS_MAP: Record<string, CompsRow> = {
  AAPL:  { ticker: "AAPL",  name: "Apple Inc.",          marketCap: 2920, ev: 2890, revenue: 394.3, ebitda: 130.5, peRatio: 30.2, evEbitda: 22.4, evRevenue: 7.3  },
  MSFT:  { ticker: "MSFT",  name: "Microsoft Corp.",      marketCap: 3090, ev: 3060, revenue: 236.6, ebitda: 123.7, peRatio: 35.8, evEbitda: 24.7, evRevenue: 12.9 },
  NVDA:  { ticker: "NVDA",  name: "NVIDIA Corp.",         marketCap: 2160, ev: 2140, revenue: 79.8,  ebitda: 50.1,  peRatio: 68.5, evEbitda: 49.1, evRevenue: 26.8 },
  GOOGL: { ticker: "GOOGL", name: "Alphabet Inc.",        marketCap: 2110, ev: 1980, revenue: 305.6, ebitda: 105.7, peRatio: 22.7, evEbitda: 17.2, evRevenue: 6.5  },
  META:  { ticker: "META",  name: "Meta Platforms",       marketCap: 1280, ev: 1240, revenue: 136.0, ebitda: 62.5,  peRatio: 27.4, evEbitda: 19.3, evRevenue: 9.1  },
  JPM:   { ticker: "JPM",   name: "JPMorgan Chase",       marketCap: 571,  ev: 610,  revenue: 158.1, ebitda: 66.5,  peRatio: 11.8, evEbitda: 8.4,  evRevenue: 3.9  },
  BAC:   { ticker: "BAC",   name: "Bank of America",      marketCap: 289,  ev: 310,  revenue: 93.8,  ebitda: 34.5,  peRatio: 12.6, evEbitda: 7.9,  evRevenue: 3.3  },
  GS:    { ticker: "GS",    name: "Goldman Sachs",        marketCap: 162,  ev: 174,  revenue: 50.3,  ebitda: 19.2,  peRatio: 14.3, evEbitda: 9.7,  evRevenue: 3.5  },
  LLY:   { ticker: "LLY",   name: "Eli Lilly",            marketCap: 706,  ev: 718,  revenue: 34.1,  ebitda: 13.4,  peRatio: 89.4, evEbitda: 58.7, evRevenue: 21.1 },
  UNH:   { ticker: "UNH",   name: "UnitedHealth Group",   marketCap: 481,  ev: 522,  revenue: 371.6, ebitda: 34.2,  peRatio: 21.2, evEbitda: 14.8, evRevenue: 1.4  },
  JNJ:   { ticker: "JNJ",   name: "Johnson & Johnson",    marketCap: 378,  ev: 394,  revenue: 85.2,  ebitda: 33.0,  peRatio: 15.9, evEbitda: 12.3, evRevenue: 4.6  },
  XOM:   { ticker: "XOM",   name: "Exxon Mobil",          marketCap: 449,  ev: 470,  revenue: 391.2, ebitda: 83.3,  peRatio: 13.7, evEbitda: 7.6,  evRevenue: 1.2  },
  CVX:   { ticker: "CVX",   name: "Chevron Corp.",        marketCap: 286,  ev: 298,  revenue: 196.9, ebitda: 39.0,  peRatio: 14.1, evEbitda: 8.1,  evRevenue: 1.5  },
  AMZN:  { ticker: "AMZN",  name: "Amazon.com Inc.",      marketCap: 2020, ev: 2060, revenue: 590.7, ebitda: 102.8, peRatio: 43.6, evEbitda: 21.8, evRevenue: 3.5  },
  TSLA:  { ticker: "TSLA",  name: "Tesla Inc.",           marketCap: 792,  ev: 778,  revenue: 97.7,  ebitda: 14.3,  peRatio: 64.2, evEbitda: 38.5, evRevenue: 7.9  },
};

export function getCompsForTicker(ticker: string): CompsRow | undefined {
  return COMPS_MAP[ticker.toUpperCase()];
}

// Return every ticker in the universe (used for thesis dropdown).
export function getAllTickers(): string[] {
  return STOCK_UNIVERSE.map((s) => s.ticker);
}
