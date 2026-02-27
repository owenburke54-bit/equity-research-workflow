export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change1d: number; // percent
  marketCap: number; // $B
  peRatio: number;
  pbRatio: number;
  evEbitda: number;
  revenueGrowthYoY: number; // percent
  ebitdaMargin: number; // percent
  isWatchlisted: boolean;
}

export interface CompsRow {
  ticker: string;
  name: string;
  marketCap: number; // $B
  ev: number; // $B
  revenue: number; // $B TTM
  ebitda: number; // $B TTM
  revenueGrowth: number; // % YoY (quarterly YoY basis from Yahoo financialData.revenueGrowth)
  grossMargin: number; // % TTM (from Yahoo financialData.grossMargins × 100)
  eps: number; // $ TTM diluted (from Yahoo defaultKeyStatistics.trailingEps)
  peRatio: number; // trailing P/E (summaryDetail.trailingPE)
  evEbitda: number; // defaultKeyStatistics.enterpriseToEbitda — direct, not derived
  evRevenue: number; // defaultKeyStatistics.enterpriseToRevenue — direct, not derived
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ThesisNote {
  ticker: string;
  bull: string;
  bear: string;
  catalysts: string;
  risks: string;
  targetPrice: string;
  checklist: ChecklistItem[];
  // Structured research framework fields
  competitiveAdvantage: string;
  catalyst: string;
  valuation: string;
  managementQuality: string;
  psychology: string;
}

export interface WorkflowState {
  watchlist: string[];
  compsTable: CompsRow[];
  thesis: ThesisNote[];
}

export interface WorkingSet {
  anchorTicker: string;
  compTickers: string[]; // does NOT include anchorTicker
}

export interface ResearchSet {
  id: string;
  name: string;
  createdAt: string; // ISO string
  anchorTicker: string;
  compTickers: string[];
  compsSnapshot: CompsRow[];
  thesis: ThesisNote | null;
  assumptions: string;
}
