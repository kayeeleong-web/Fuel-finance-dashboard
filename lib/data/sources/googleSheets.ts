import { google } from "googleapis";
import type { DataSource } from "../source";
import { DEFAULT_REVALIDATE_SECONDS } from "../source";
import type {
  KPIReportData,
  MetricRow,
  StatementType,
  ReportRange,
  FinancialStatementData,
  FinancialStatementRow,
  CustomReportData,
  DashboardSummary,
  Unit,
} from "../types";

/**
 * Google Sheets DataSource.
 *
 * ⚠️ Runs on the Node.js runtime only (the `googleapis` package needs Node APIs) —
 * any route/page that calls this must NOT set `export const runtime = "edge"`.
 *
 * Auth: ONE Google Service Account PER CLIENT (never share one account across clients —
 * see fuel-vercel-dashboard-design-rules.md). The client's Sheet is shared with this
 * client's own service-account email as Viewer, and only this repo's env vars hold its key.
 *
 * Required env vars (per client repo):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY   (base64-encoded — decode before use, see below)
 *   GOOGLE_SHEET_ID
 *
 * Sheet contract (fixed tab names + header rows — do not rename per client):
 *
 *   KPI_Report
 *     Row 1 (headers): Section | Key | Label | Unit | Current | Prior | PriorYear | YTD | TTM |
 *       Benchmark | IsTotal | Trend1..Trend12 (cols L–W, oldest → newest, trailing 12 months —
 *       feeds the hero chart's metric dropdown; leave blank for a metric that isn't chartable)
 *     Cell Y1: the report month as ISO "YYYY-MM" (e.g. "2026-06")
 *     Data starts row 2.
 *
 *   PL / CF / BS
 *     Row 1 (headers): Section | Key | Label | IsTotal | <month columns as ISO "YYYY-MM", oldest → newest>
 *     Data starts row 2.
 *
 *   Custom_Reports_Index
 *     Row 1 (headers): Id | Name | GeneratedAt | Status | SheetTab
 *     Each row points at another tab (SheetTab) holding that custom report's own
 *     Row 1 headers + data — columns are whatever that report needs.
 *
 *   Dashboard_Data
 *     Row 1 (headers): Month | Narrative | CriticalPhrase
 *     Exactly one data row (row 2) — the current month's Executive Summary text,
 *     authored offline (see lib/data/README.md). CriticalPhrase must be a verbatim
 *     substring of Narrative; the Dashboard panel bolds/pinks exactly that phrase.
 *     The rest of the Dashboard tab (summary cards, trend charts) is NOT stored here —
 *     it's computed client-side from the PL statement already fetched via getStatement,
 *     see lib/calc/dashboardMetrics.js.
 */

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const encodedKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !encodedKey) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY env vars."
    );
  }

  const privateKey = Buffer.from(encodedKey, "base64").toString("utf-8");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

async function getValues(sheetId: string, range: string): Promise<string[][]> {
  const auth = getAuthClient();
  const token = await auth.getAccessToken();

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
      range
    )}`,
    {
      headers: { Authorization: `Bearer ${token.token}` },
      next: { revalidate: DEFAULT_REVALIDATE_SECONDS },
    }
  );

  if (!res.ok) {
    throw new Error(
      `Google Sheets fetch failed for range "${range}" (${res.status}). Check the sheet is shared with ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL} and that the tab exists.`
    );
  }

  const json = (await res.json()) as { values?: string[][] };
  return json.values ?? [];
}

function toNumberOrNull(v: string | undefined): number | null {
  if (v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[,$%]/g, ""));
  return Number.isNaN(n) ? null : n;
}

function toUnit(v: string | undefined): Unit {
  const u = (v ?? "number").toLowerCase();
  if (u === "currency" || u === "percent" || u === "ratio") return u;
  return "number";
}

export class GoogleSheetsDataSource implements DataSource {
  private sheetId: string;

  constructor(sheetId?: string) {
    const id = sheetId ?? process.env.GOOGLE_SHEET_ID;
    if (!id) throw new Error("Missing GOOGLE_SHEET_ID env var.");
    this.sheetId = id;
  }

  async getKPIData(): Promise<KPIReportData> {
    const [rows, monthCell] = await Promise.all([
      getValues(this.sheetId, "KPI_Report!A2:W"),
      getValues(this.sheetId, "KPI_Report!Y1:Y1"),
    ]);

    const metricRows: MetricRow[] = rows
      .filter((r) => r[1]) // has a Key
      .map((r) => {
        const trend = r
          .slice(11, 23) // Trend1..Trend12, cols L..W
          .map((v) => toNumberOrNull(v))
          .filter((v): v is number => v !== null);
        return {
          section: r[0] ?? "Uncategorized",
          key: r[1],
          label: r[2] ?? r[1],
          unit: toUnit(r[3]),
          current: toNumberOrNull(r[4]),
          prior: toNumberOrNull(r[5]),
          priorYear: toNumberOrNull(r[6]),
          ytd: toNumberOrNull(r[7]),
          ttm: toNumberOrNull(r[8]),
          benchmark: toNumberOrNull(r[9]),
          isTotal: (r[10] ?? "").toLowerCase() === "true",
          trend: trend.length > 0 ? trend : undefined,
        };
      });

    return {
      month: monthCell[0]?.[0] ?? "",
      rows: metricRows,
    };
  }

  async getStatement(type: StatementType, range: ReportRange): Promise<FinancialStatementData> {
    const header = await getValues(this.sheetId, `${type}!1:1`);
    const monthCols = (header[0] ?? []).slice(4); // columns after Section|Key|Label|IsTotal
    const monthsWanted = monthsForRange(monthCols, range);

    const body = await getValues(this.sheetId, `${type}!A2:${colLetter(3 + monthCols.length)}`);

    const rows: FinancialStatementRow[] = body
      .filter((r) => r[1])
      .map((r) => {
        const values: Record<string, number | null> = {};
        monthCols.forEach((month, i) => {
          if (monthsWanted.includes(month)) {
            values[month] = toNumberOrNull(r[4 + i]);
          }
        });
        return {
          key: r[1],
          label: r[2] ?? r[1],
          section: r[0] ?? "Uncategorized",
          isTotal: (r[3] ?? "").toLowerCase() === "true",
          values,
        };
      });

    return { type, months: monthsWanted, rows };
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const row = await getValues(this.sheetId, "Dashboard_Data!A2:C2");
    const [month, narrative, criticalPhrase] = row[0] ?? [];
    return {
      month: month ?? "",
      narrative: narrative ?? "",
      criticalPhrase: criticalPhrase || undefined,
    };
  }

  async listCustomReports() {
    const rows = await getValues(this.sheetId, "Custom_Reports_Index!A2:E");
    return rows
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0],
        name: r[1] ?? r[0],
        generatedAt: r[2] ?? "",
        status: (r[3] ?? "Draft") as CustomReportData["status"],
      }));
  }

  async getCustomReport(reportId: string): Promise<CustomReportData> {
    const index = await getValues(this.sheetId, "Custom_Reports_Index!A2:E");
    const meta = index.find((r) => r[0] === reportId);
    if (!meta) throw new Error(`No custom report "${reportId}" in Custom_Reports_Index.`);

    const sheetTab = meta[4];
    const header = await getValues(this.sheetId, `${sheetTab}!1:1`);
    const columns = header[0] ?? [];
    const body = await getValues(
      this.sheetId,
      `${sheetTab}!A2:${colLetter(columns.length)}`
    );

    const rows = body.map((r) => {
      const row: Record<string, string | number | null> = {};
      columns.forEach((c, i) => {
        const raw = r[i];
        const n = toNumberOrNull(raw);
        row[c] = n !== null && raw !== undefined && raw !== "" ? n : raw ?? null;
      });
      return row;
    });

    return {
      id: reportId,
      name: meta[1] ?? reportId,
      generatedAt: meta[2] ?? "",
      status: (meta[3] ?? "Draft") as CustomReportData["status"],
      columns,
      rows,
    };
  }
}

function monthsForRange(allMonths: string[], range: ReportRange): string[] {
  const n = range === "6M" ? 6 : range === "12M" ? 12 : 24;
  return allMonths.slice(-n);
}

/** 0-indexed column count → spreadsheet column letter (0 => A, 25 => Z, 26 => AA...). */
function colLetter(count: number): string {
  let n = count;
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}
