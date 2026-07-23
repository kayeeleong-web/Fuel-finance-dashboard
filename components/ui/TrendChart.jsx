'use client';

import { useState } from 'react';

/**
 * Generic trend chart (bar or line), used everywhere a chart is needed —
 * KPI Report hero chart, Dashboard side/hero/mini charts.
 *
 * Implements the universal chart rules from docs/design-rules.md §1 by construction,
 * not by convention — a caller cannot accidentally ship a chart missing these:
 *   - Fills its container: viewBox + preserveAspectRatio="none", parent CSS
 *     (.chart-panel svg in globals.css) stretches it to the card's actual size.
 *   - Labels every data point with its value — always rendered, not hover-gated.
 *   - Exactly one dashed reference line with an inline label, pinned to the far left of
 *     the plot so it never collides with a data-point label (see `referenceOptions`).
 *   - The current/selected period is rendered solid black; every other point uses `color`.
 *
 * Reference-line switcher: pass 2+ entries in `referenceOptions` (e.g. Avg + Benchmark)
 * and a small toggle renders above the chart so the reader picks which one to compare
 * against — pass a single entry for a chart that only has one meaningful comparison
 * (most Dashboard charts, which have no benchmark/plan figure in the data model yet).
 *
 * Drill-down (design-rules.md §4 "Drill-down rule" / functionality-spec.md §6): pass
 * `drillDown` ({components, calcNote}) to get the hover breakdown panel for free — both
 * the bar and line variant expose the same `.bar-highlight` class hook on the active
 * point so globals.css's `:has(.bar-highlight:hover)` rule reveals it. Omit it for
 * charts that don't need drill-down (e.g. the small supporting charts).
 */
export function TrendChart({
  data, // [{ label: string, value: number }]
  variant = 'bar', // 'bar' | 'line'
  color = 'var(--blue)',
  currentIndex,
  referenceOptions = [], // [{ key, name, value }] — line label = `${name} ${valueFormat(value)}`
  valueFormat = (v) => String(v),
  viewBoxWidth = 640,
  viewBoxHeight = 220,
  // Small supporting charts (design-rules.md §4 "three small supporting charts") don't
  // get force-stretched to fill a fixed card height — that's what was squeezing/
  // distorting them when they shared the regular chart's height:100% CSS rule.
  // Natural aspect-ratio sizing (see .mini-chart in globals.css) fixes that.
  mini = false,
  drillDown, // { components: [{label, value, negative?}], calcNote }
}) {
  const [refKey, setRefKey] = useState(referenceOptions[0]?.key);
  const activeRef = referenceOptions.find((r) => r.key === refKey) ?? referenceOptions[0];

  if (!data || data.length === 0) {
    return <div className="cap">No data for this chart yet.</div>;
  }

  const width = viewBoxWidth;
  const height = viewBoxHeight;
  const padTop = 34;
  const padBottom = 26;
  const padX = 40;

  const activeIndex = currentIndex ?? data.length - 1;
  const values = data.map((d) => d.value ?? 0);
  // Scale is fixed across every reference option (not just the active one) so switching
  // the toggle doesn't jump the bars/line around.
  const allValues = [...values, ...referenceOptions.map((r) => r.value)];
  const max = Math.max(...allValues, 0);
  const min = Math.min(...allValues, 0);
  const span = max - min || 1;
  const plotTop = padTop;
  const plotBottom = height - padBottom;
  const plotHeight = plotBottom - plotTop;

  const yFor = (v) => plotBottom - ((v - min) / span) * plotHeight;

  const n = data.length;
  const slot = (width - padX * 2) / n;
  const xFor = (i) => padX + slot * i + slot / 2;

  const refY = activeRef ? yFor(activeRef.value) : null;
  const refLabel = activeRef ? `${activeRef.name} ${valueFormat(activeRef.value)}` : null;

  return (
    <>
      {referenceOptions.length > 1 && (
        <div className="ref-toggle">
          {referenceOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={opt.key === activeRef?.key ? 'active' : undefined}
              onClick={() => setRefKey(opt.key)}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}

      <svg
        className={mini ? 'mini-chart' : variant === 'line' ? 'line-chart' : 'bar-chart'}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {refY != null && (
          <>
            <line
              x1={padX - 2} y1={refY} x2={width - padX + 2} y2={refY}
              stroke="var(--muted-2)" strokeWidth="1.5" strokeDasharray="5,4"
            />
            {/* Pinned to the far-left margin (before the plot area even starts), and below
                the line rather than above it — data-point labels are always drawn above
                their point, so this keeps the reference label out of their way regardless
                of where the line falls in the chart (the collision this used to cause). */}
            <text x={4} y={refY + 11} fontSize="9" fill="var(--muted-2)">
              {refLabel}
            </text>
          </>
        )}

        {variant === 'bar' &&
          data.map((d, i) => {
            const barW = slot * 0.62;
            const x = xFor(i) - barW / 2;
            const y = yFor(d.value);
            const barH = plotBottom - y;
            const isActive = i === activeIndex;
            return (
              <g key={d.label + i} className={isActive ? 'bar-highlight' : undefined}>
                <rect
                  x={x} y={y} width={barW} height={Math.max(barH, 1)} rx="3"
                  fill={isActive ? 'var(--black)' : `${color}`}
                  fillOpacity={isActive ? 1 : 0.14}
                  stroke={isActive ? 'none' : color}
                  strokeOpacity={isActive ? 0 : 0.55}
                />
                <text
                  x={xFor(i)} y={y - 6} textAnchor="middle" fontSize="10.5"
                  fontWeight={isActive ? 700 : 400}
                  fill={isActive ? 'var(--text)' : 'var(--muted)'}
                >
                  {valueFormat(d.value)}
                </text>
              </g>
            );
          })}

        {variant === 'line' && (
          <>
            <polyline
              points={data.map((d, i) => `${xFor(i)},${yFor(d.value)}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            {data.map((d, i) => {
              const isActive = i === activeIndex;
              // Stagger alternating points' labels further up — on a 12-point line chart
              // neighboring values are often close together, so labels drawn at the exact
              // same offset run into each other horizontally. Doubling the effective
              // vertical lane between neighbors gives each one room without hiding any.
              // Point 0 (i even) gets the larger offset specifically because it's the one
              // nearest the reference label's fixed left position — pushing it further up
              // keeps it clear of that label too, not just its own neighbor.
              const labelOffset = 10 + (i % 2 === 0 ? 12 : 0);
              return (
                <g key={d.label + i} className={isActive ? 'bar-highlight' : undefined}>
                  <circle cx={xFor(i)} cy={yFor(d.value)} r={isActive ? 4.5 : 3.5} fill={isActive ? 'var(--black)' : color} />
                  <text
                    x={xFor(i)} y={yFor(d.value) - labelOffset} textAnchor="middle" fontSize="10.5"
                    fontWeight={isActive ? 700 : 400}
                    fill={isActive ? 'var(--text)' : 'var(--muted)'}
                  >
                    {valueFormat(d.value)}
                  </text>
                </g>
              );
            })}
          </>
        )}

        <g fontSize="9.5" fill="var(--muted-2)" textAnchor="middle">
          {data.map((d, i) => (
            <text key={d.label + i} x={xFor(i)} y={height - 6}>
              {d.label}
            </text>
          ))}
        </g>
      </svg>

      {drillDown && (
        <div className="drill-panel">
          {drillDown.components?.map((c) => (
            <div className="comp-row" key={c.label}>
              <span>{c.label}</span>
              <b className={c.negative ? 'r' : undefined}>{c.value}</b>
            </div>
          ))}
          {drillDown.calcNote && <div className="calc-note">{drillDown.calcNote}</div>}
        </div>
      )}
    </>
  );
}
