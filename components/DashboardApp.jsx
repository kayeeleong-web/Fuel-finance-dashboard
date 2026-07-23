'use client';

import { useState } from 'react';
import { Topbar } from './shell/Topbar';
import { TabNav } from './shell/TabNav';
import { Footer } from './shell/Footer';
import { KPIReportPanel } from './panels/KPIReportPanel';
import { DashboardPanel } from './panels/DashboardPanel';
import { ReportsPanel } from './panels/ReportsPanel';
import { CustomPanel } from './panels/CustomPanel';

/**
 * The whole client-facing product, post-Clerk-auth. This IS the "Portal" — there is
 * no separate portal app/repo (see architecture note in CLAUDE.md): the default
 * landing tab is KPI Report, and Dashboard/Reports/Custom are sibling tabs in the
 * same shell, not separate pages or deployments.
 *
 * All data for all 4 tabs is fetched ONCE, server-side, in app/page.js and passed in
 * here as props — switching tabs only toggles which panel is visible (functionality-spec.md
 * §2: "no page reload, no data refetch"). Every panel stays mounted; the CSS
 * `.panel-view` / `.panel-view.active` classes control visibility, matching the
 * reference build's behavior exactly.
 */
export function DashboardApp({ clientName, kpiData, dashboardSummary, statements, customReportsList }) {
  const [activeTab, setActiveTab] = useState('kpi');

  return (
    <>
      <Topbar clientName={clientName} onLogoClick={() => setActiveTab('kpi')} />
      <TabNav activeTab={activeTab} onChange={setActiveTab} reportsCount={customReportsList.length + 3} />

      <div className="page">
        <section className={`panel-view${activeTab === 'kpi' ? ' active' : ''}`}>
          <KPIReportPanel kpiData={kpiData} />
        </section>

        <section className={`panel-view${activeTab === 'dashboard' ? ' active' : ''}`}>
          <DashboardPanel summary={dashboardSummary} plStatement={statements.PL} kpiData={kpiData} />
        </section>

        <section className={`panel-view${activeTab === 'reports' ? ' active' : ''}`}>
          <ReportsPanel statements={statements} customReports={customReportsList} />
        </section>

        <section className={`panel-view${activeTab === 'custom' ? ' active' : ''}`}>
          <CustomPanel reportsCount={customReportsList.length} />
        </section>
      </div>

      <Footer />
    </>
  );
}
