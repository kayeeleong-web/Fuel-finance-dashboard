'use client';

import { useState } from 'react';
import { PageHead } from '../ui/PageHead';
import { DrillPopover } from '../ui/DrillPopover';
import { formatMonthLabel } from '../../lib/calc/dashboardMetrics';

const STATEMENT_LABELS = { PL: 'P&L', CF: 'Cash Flow', BS: 'Balance Sheet' };
const STATUS_CLASS = { Ready: 'good', 'In Review': undefined, Scheduled: undefined, Draft: undefined };

/**
 * Reports tab — design-rules.md §5 / functionality-spec.md §5.
 *
 * Range toggle (6M/12M/24M) is CSS-driven, not a refetch: `statements` here already
 * holds the full 24-month range for each statement (fetched once, server-side, with
 * getStatement(type, "24M")) — switching range only changes the `data-range` attribute,
 * which globals.css uses to hide month columns tagged outside that range. The
 * always-visible label column never carries an r6/r12/r24 class, so the design-rules.md
 * "never hide row labels" rule holds by construction, not by convention.
 */
export function ReportsPanel({ statements, customReports }) {
  const [reportType, setReportType] = useState('PL');
  const [range, setRange] = useState('6');

  return (
    <>
      <PageHead title="Reports" subtitle="P&L, Cash Flow, Balance Sheet, and saved custom reports" />

      <div className="toolbar">
        <div className="seg">
          {['PL', 'CF', 'BS', 'custom'].map((type) => (
            <button
              key={type}
              className={reportType === type ? 'active' : undefined}
              onClick={() => setReportType(type)}
            >
              {type === 'custom' ? 'Custom' : STATEMENT_LABELS[type]}
            </button>
          ))}
        </div>
        {reportType !== 'custom' && (
          <div className="seg right">
            {['6', '12', '24'].map((r) => (
              <button key={r} className={range === r ? 'active' : undefined} onClick={() => setRange(r)}>
                {r}M
              </button>
            ))}
          </div>
        )}
      </div>

      {reportType !== 'custom' ? (
        <StatementDoc statement={statements[reportType]} range={range} />
      ) : (
        <CustomReportsList reports={customReports} />
      )}
    </>
  );
}

function rangeClasses(monthIndex, totalMonths) {
  // Tag from the END (most recent months first) — r6 = last 6, r12 = last 12, r24 = all.
  const fromEnd = totalMonths - monthIndex;
  const classes = ['r24'];
  if (fromEnd <= 12) classes.push('r12');
  if (fromEnd <= 6) classes.push('r6');
  return classes.join(' ');
}

/** Other line items in the same section as `row`, at one specific month — the real
 *  components that sum to a total/subtotal row's figure for that column (design-rules.md
 *  §5 / functionality-spec.md §6: popover numbers must come from the same data as the
 *  visible figure). Leaf (non-total) rows have no further breakdown in this data model,
 *  so they don't get a popover — never fabricate a composition that isn't there. */
function siblingValuesAtMonth(rows, row, month) {
  return rows
    .filter((r) => r.key !== row.key && !r.isTotal)
    .map((r) => ({
      label: r.label,
      value: r.values[month] != null ? `$${Math.round(r.values[month]).toLocaleString('en-US')}` : '—',
    }));
}

function StatementDoc({ statement, range }) {
  if (!statement) return <div className="cap">No data for this statement yet.</div>;
  const currentMonth = statement.months[statement.months.length - 1];

  return (
    // "report-doc" (not just "table-wrap") is what the range-toggle CSS below actually
    // targets (`#reports[data-range] .report-doc:not([data-doc="custom"])`) — without it
    // the 6M/12M/24M buttons change `data-range` but nothing was ever selected by it.
    <div id="reports" data-range={range} className="table-wrap report-doc" data-doc={statement.type}>
      <table>
        <thead>
          <tr>
            <th>Account / Line Item</th>
            {statement.months.map((m, i) => (
              <th
                key={m}
                className={`${rangeClasses(i, statement.months.length)}${m === currentMonth ? ' active-col' : ''}`}
              >
                {formatMonthLabel(m)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupBySection(statement.rows).map(([section, rows]) => (
            <FragmentRows key={section} section={section} rows={rows} months={statement.months} currentMonth={currentMonth} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FragmentRows({ section, rows, months, currentMonth }) {
  return (
    <>
      {/* Two cells, not one colSpan cell — position:sticky on a <td> with colspan doesn't
          reliably stick in table layout (a well-known cross-browser limitation), which
          was letting the section band's label scroll away with the rest of the row. A
          real single-column first cell sticks the same way a normal data row's does. */}
      <tr className="section">
        <td>{section}</td>
        <td colSpan={months.length}></td>
      </tr>
      {rows.map((row) => (
        <tr key={row.key} className={row.isTotal ? 'total' : undefined}>
          <td>{row.label}</td>
          {months.map((m, i) => {
            const cellText = row.values[m] != null ? `$${Math.round(row.values[m]).toLocaleString('en-US')}` : '—';
            return (
              <td
                key={m}
                className={`${rangeClasses(i, months.length)}${m === currentMonth ? ' active-col' : ''}`}
              >
                {row.isTotal && row.values[m] != null ? (
                  <DrillPopover label={row.label} value={cellText} components={siblingValuesAtMonth(rows, row, m)} />
                ) : (
                  cellText
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

function groupBySection(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.section)) map.set(row.section, []);
    map.get(row.section).push(row);
  }
  return Array.from(map.entries());
}

function CustomReportsList({ reports }) {
  if (!reports || reports.length === 0) {
    return <div className="cap">No custom reports saved yet — build one from the Custom tab.</div>;
  }
  return (
    <div className="table-wrap" style={{ padding: '4px 0' }}>
      {reports.map((r) => (
        <div key={r.id} className="toolbar" style={{ padding: '12px 18px', margin: 0 }}>
          <div>
            <b>{r.name}</b>
            <div className="cap">
              {r.generatedAt} · <span className={`health-badge ${STATUS_CLASS[r.status] ?? ''}`}>{r.status}</span>
            </div>
          </div>
          <button className="btn">Export</button>
        </div>
      ))}
    </div>
  );
}
