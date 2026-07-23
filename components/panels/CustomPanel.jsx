'use client';

import { PageHead } from '../ui/PageHead';

/**
 * Custom tab — design-rules.md §5 / functionality-spec.md §7.
 * A simple empty state until reports are saved — no fake charts before there's real
 * content. "New custom report" opens the builder flow (source → metrics → period →
 * preview → save); not built yet, see functionality-spec.md §7.
 */
export function CustomPanel({ reportsCount = 0 }) {
  return (
    <>
      <PageHead title="Custom" subtitle="Build and save ad-hoc reports">
        <button className="btn primary">New custom report</button>
      </PageHead>

      {reportsCount === 0 ? (
        <div className="chart-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="exec-summary" style={{ display: 'inline-flex', marginBottom: 16 }}>
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          </div>
          <h3>No custom reports yet</h3>
          <p className="cap" style={{ margin: '8px auto 20px', maxWidth: 380 }}>
            Build a report from any of the P&L, Cash Flow, Balance Sheet, or a raw account
            list — pick the metrics/accounts and period you need, preview it, and save.
          </p>
          <button className="btn primary">New custom report</button>
        </div>
      ) : (
        <p className="cap">Saved custom reports appear in the Reports tab's Custom slot.</p>
      )}
    </>
  );
}
