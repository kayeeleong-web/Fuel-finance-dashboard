'use client';

/**
 * Topbar — design-rules.md §2. Logo + client breadcrumb on the left, avatar only on
 * the right. No period/date picker here — each tab owns its own period control
 * (see PageHead / kpi-controls in the panels).
 */
export function Topbar({ clientName, userInitials = 'FM', onLogoClick, onAvatarClick }) {
  return (
    <div className="topbar">
      <div className="brand">
        <button className="fuel-logo" onClick={onLogoClick} aria-label="Back to KPI Report" style={{ border: 'none', cursor: 'pointer' }}>
          <img src="/logo-black.svg" alt="Fuel" />
        </button>
        <div className="divider" />
        <div className="crumb">
          <span className="dot" />
          <span className="name">
            Client · <b>{clientName}</b>
          </span>
        </div>
      </div>
      <div className="top-actions">
        {/* Avatar click → account menu (profile / switch client / sign out).
            Not built yet — see docs/functionality-spec.md §1. */}
        <button className="avatar" onClick={onAvatarClick} aria-label="Account menu">
          {userInitials}
        </button>
      </div>
    </div>
  );
}
