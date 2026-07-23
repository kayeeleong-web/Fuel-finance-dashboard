/**
 * Per-client config — the ONE file that changes between client repos besides env vars.
 * Copy this to `client.config.ts` when setting up a new client and fill in the values.
 */

export type GoogleSheetsSource = {
  type: "googleSheets";
  /** Falls back to GOOGLE_SHEET_ID env var if omitted — set here only if you need to
   *  read from more than one sheet (rare). */
  sheetId?: string;
};

export type QBOSource = {
  type: "qbo";
  realmId: string; // QBO company id for this client
};

// NOTE: typed explicitly as the union (not inferred via `satisfies`/`as const`) so that
// lib/data/index.ts's switch on `dataSource.type` stays exhaustive over BOTH backends —
// narrowing it to whichever one this client currently uses would break the QBO branch.
export const clientConfig = {
  name: "Acme Inc.",
  slug: "acme", // used for repo name (fuel-acme-dashboard), Vercel project name, and the acme.fuelfinance.me subdomain (see README.md "Deploying to Vercel")

  dataSource: {
    type: "googleSheets",
    // sheetId left out on purpose — comes from GOOGLE_SHEET_ID env var for this client
  } as GoogleSheetsSource | QBOSource,

  // Standard tab set — see lib/data/sources/googleSheets.ts header for the exact
  // per-tab column contract. Do not rename these per client; the parser depends on them.
  tabs: {
    kpi: "KPI_Report",
    pl: "PL",
    cf: "CF",
    bs: "BS",
    customIndex: "Custom_Reports_Index",
  },
};
