import type { DataSource } from "./source";
import { GoogleSheetsDataSource } from "./sources/googleSheets";
import { QBODataSource } from "./sources/qbo";
import { clientConfig } from "@/config/client.config";

export type { DataSource } from "./source";
export * from "./types";

/**
 * Single entry point for every page/component. Never `import { GoogleSheetsDataSource }`
 * directly in a page — always `import { getDataSource } from "@/lib/data"` so the backend
 * stays swappable per client via `client.config.ts` alone.
 *
 *   const source = getDataSource();
 *   const kpis = await source.getKPIData();
 */
export function getDataSource(): DataSource {
  switch (clientConfig.dataSource.type) {
    case "googleSheets":
      return new GoogleSheetsDataSource(clientConfig.dataSource.sheetId);
    case "qbo":
      return new QBODataSource(clientConfig.dataSource.realmId);
    default: {
      const _exhaustive: never = clientConfig.dataSource;
      throw new Error(`Unknown dataSource.type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
