import type {
  KPIReportData,
  StatementType,
  ReportRange,
  FinancialStatementData,
  CustomReportData,
  DashboardSummary,
} from "./types";

/**
 * Contract every data backend (Google Sheets today, QBO later, anything else after that)
 * must implement. Pages/components import from `lib/data` (the factory), never from a
 * specific source file — swapping a client's backend is a one-line config change, not a
 * rewrite of the UI.
 */
export interface DataSource {
  getKPIData(): Promise<KPIReportData>;
  getStatement(type: StatementType, range: ReportRange): Promise<FinancialStatementData>;
  getCustomReport(reportId: string): Promise<CustomReportData>;
  listCustomReports(): Promise<Pick<CustomReportData, "id" | "name" | "generatedAt" | "status">[]>;
  /** The Dashboard tab's Executive Summary — see DashboardSummary for why this is
   *  authored offline rather than computed. */
  getDashboardSummary(): Promise<DashboardSummary>;
}

/** How long fetched data may be served stale before re-fetching, in seconds. */
export const DEFAULT_REVALIDATE_SECONDS = 300;
