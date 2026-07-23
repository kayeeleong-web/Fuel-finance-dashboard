/**
 * Page head pattern — design-rules.md §2. h1 + one-line muted description on the
 * left, page-specific controls/actions on the right. This left/right split is fixed
 * across every tab — don't move the title or bury actions on the left.
 */
export function PageHead({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children && <div className="head-actions">{children}</div>}
    </div>
  );
}
