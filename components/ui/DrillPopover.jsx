'use client';

/**
 * Universal hover drill-down popover — functionality-spec.md §6.
 * Wraps any value that has a real composition (a total made of parts). Hover-only,
 * no click, no pinned state; dismisses on mouse-leave automatically via CSS (:hover).
 *
 * Don't wrap a raw count or a percentage that's just two other visible numbers divided —
 * see design-rules.md §4a. Only wrap numbers with a genuine breakdown to show.
 */
export function DrillPopover({ label, value, components, calcNote, children }) {
  return (
    <span className="drillable">
      {value ?? children}
      <span className="drill-pop">
        <div className="drill-label">{label}</div>
        {components?.map((c) => (
          <div className="comp-row" key={c.label}>
            <span>{c.label}</span>
            <b className={c.negative ? 'r' : undefined}>{c.value}</b>
          </div>
        ))}
        {calcNote && <div className="calc-note">{calcNote}</div>}
      </span>
    </span>
  );
}
