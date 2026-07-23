# Fuel Finance — Vercel Client Dashboard: Functionality Spec

**What this file is:** a behavior spec, not a design spec. `fuel-vercel-dashboard-design-rules.md` says what everything must *look* like. `fuel-finance-design-template.html` is a static example of that look, wired up with just enough JS to demo the interactions. **This file says what every clickable, hoverable, or toggleable thing is supposed to *do*** — so when an FM (or a developer working from an FM's brief) copies the repo to start a new client build, they know which pieces already work as-is, which are static mockups standing in for a real feature, and which need a real backend behind them.

For each control below: **Behavior** (what happens), **Scope** (what it affects), **Status in the reference build** (Real / Demo-only / Not built).

---

## 1. Topbar

| Control | Behavior | Scope | Status |
|---|---|---|---|
| Fuel logo | Click returns to the KPI Report tab (the default landing view). | Whole page | Not built — currently decorative |
| Client breadcrumb (dot + name) | Static identifier. Not clickable. If Fuel ever manages multiple entities per client, this is where an entity switcher would go — out of scope until that's needed. | — | Real (static, as intended) |
| Avatar | Click opens an account menu: profile, switch client (if the logged-in user has access to more than one), sign out. | Whole session | Not built — currently decorative |

## 2. Tab navigation

| Control | Behavior | Scope | Status |
|---|---|---|---|
| KPI Report / Dashboard / Reports / Custom buttons | Click hides every `.panel-view`, shows the one matching `data-tab`, and moves the `active` class to the clicked button. No page reload, no data refetch — all data for all tabs loads once, up front. | Whole page | **Real** — implemented in the reference build's inline script |
| Reports count badge | Shows the number of saved reports (core 3 statements + however many Custom ones exist). Recalculates whenever a custom report is saved or deleted. | Reports tab only | Not built — currently a hardcoded number |

## 3. KPI Report tab

| Control | Behavior | Scope | Status |
|---|---|---|---|
| MoM / YoY toggle | A `.seg` segmented control (same pattern as the Reports tab's report-type toggle) — exactly one mode has the white active pill at a time, so which one is active is unambiguous. Switches the table's comparison-column group between `Prior month/MoM Var/MoM%` and `Prior year/YoY Var/YoY%`. Benchmark/vs Benchmark are always-present columns, not part of this toggle. | KPI table only | **Real** |
| Month-selector chip | A real month picker (dropdown of the trailing 12 months). Selecting a month re-renders the hero chart, the 6 KPI cards, and the table's current/prior figures from each row's trend history. Prior Year/YTD/TTM/Benchmark can't be recomputed for a past month from the current data contract (the KPI_Report sheet only holds one reported month's values for those) — they render as "—" rather than a stale/wrong number when a past month is selected. Metrics with no trend array are unaffected by the picker. | Whole KPI Report tab | **Real**, with the above data-contract limitation |
| Chart metric dropdown | Opens a list of the KPI metrics in the table below; selecting one swaps the hero chart's data/title/reference line to that metric. | Hero chart only | **Real** |
| Hero chart | Hovering the highlighted (black/active) point shows the drill-down panel (§6), same mechanism as a Dashboard hero chart. | Hero chart only | **Real** |
| KPI cards | Hover shows the drill-down popover (§6). Not clickable. | — | **Real** (hover only, per §6) |
| Export PDF | Opens the browser's native print dialog (`window.print()`) with the current KPI Report view as-filtered/toggled; a print stylesheet hides the topbar/nav/controls so "Save as PDF" produces a clean report, not a screenshot of the app chrome. | KPI Report tab only | **Real** — no server render, so formatting is whatever the browser's print engine produces rather than a pixel-identical branded PDF; upgrading to a server-rendered PDF (e.g. via a headless-browser endpoint) is a reasonable next step if exact branded output is needed |
| Table section headers | Static grouping labels. Not clickable, not collapsible. | — | Real (static, as intended) |

## 4. Dashboard tab

| Control | Behavior | Scope | Status |
|---|---|---|---|
| Executive Summary | Static generated text for the period shown. Regenerates when the period changes (there's no period picker on this tab yet — it inherits whatever period the session is in). | Dashboard tab | Not built — currently hardcoded copy |
| Summary cards | Hover shows the drill-down popover (§6). Not clickable. | — | **Real** (hover only) |
| Chart bars/points | Hovering the highlighted (black) bar shows the drill-down popover (§6) floating over the chart. Historical (non-highlighted) bars are not interactive — they don't need their own drill-down since they're not the period being discussed. | That chart only | **Real** — CSS-only hover, no JS |
| Export PDF | Opens the browser's native print dialog (`window.print()`) with the whole Dashboard tab (exec summary + all charts); same print stylesheet as the KPI Report's Export PDF. | Dashboard tab only | **Real** — same caveat as the KPI Report's Export PDF above |

## 5. Reports tab

| Control | Behavior | Scope | Status |
|---|---|---|---|
| P&L / Cash Flow / Balance Sheet / Custom segmented control | Click shows the matching `.report-doc`, hides the other three. Exactly one is visible at a time. | Reports tab only | **Real** — implemented in the reference build's inline script |
| 6M / 12M / 24M segmented control | Sets `data-range` on the `#reports` container, which the CSS uses to hide month columns outside the selected range. The label column and every total-row label stay visible regardless of range (see design rules § 5) — this is a CSS rule, not something a future dev needs to reimplement in JS. | The currently-visible report only (all three core statements share the same range state; Custom ignores it) | **Real** |
| Every numeric cell (all 24 months, every line item) | Hover shows the drill-down popover (§6) with that exact cell's component breakdown for that exact month. | That cell only | **Real** — pre-rendered per cell, no JS |
| Export PDF (row-level button) | Generates a PDF of *only the currently visible report* (not the whole tab) and downloads it. | The visible report only | Not built — needs a PDF-render endpoint |
| "Generate report" (primary button, page head) | Opens a flow to kick off a new one-off statement generation (e.g. re-run this month's close into a fresh P&L) — distinct from Export, which just downloads what's already on screen. | Reports tab | Not built |
| Status badges (Ready / In Review / Scheduled / Draft) | Informational only. Reflects the report's real pipeline state once report generation is wired to a backend — not clickable. | — | Not built — currently hardcoded per report |

## 6. Universal drill-down popover (applies everywhere above)

This is one mechanism, reused identically across KPI cards, Dashboard summary cards, Dashboard chart bars, and every numeric cell in every Reports table.

- **Trigger:** mouse hover over any element with the `.drillable` class. No click required.
- **Behavior:** a small card (`.drill-pop`) fades in *on top of* the surrounding content (never pushes other content down or opens inline underneath) showing: a label naming the metric and the exact period, a short list of the components that sum to that number, and one line stating the formula.
- **Dismiss:** mouse-leave. There is no pinned/sticky state — moving the cursor away always closes it.
- **Data:** in the reference build every popover's numbers are pre-computed from the same mock dataset as the visible table (see `fuel-finance-design-template.html` — every total row's breakdown is the literal sum of the rows above it in that same column, not placeholder text). When wiring a real client, generate these server-side or at build time from the same source that renders the table, so the popover can never disagree with the number it's attached to.
- **Where it does *not* apply:** a number with no real composition (a raw count, a percentage that's just two other visible numbers divided) doesn't get a popover — see design rules § 4a.

## 7. Custom tab

| Control | Behavior | Scope | Status |
|---|---|---|---|
| "New custom report" (empty-state button, and page-head button) | Opens the custom report builder: pick a source (P&L / Cash Flow / Balance Sheet / a raw account list), pick metrics/accounts, pick a period, preview, save. A saved report appears as the Custom slot's contents inside the Reports tab (§ 3.3 of the design rules) and increments the Reports count badge. | Whole product (writes into Reports tab) | Not built |

---

## 8. What "copying the repo" actually gets you today

Everything marked **Real** above works out of the box with zero backend: tab switching, the report-type and range toggles, and every drill-down popover. Everything marked **Not built** is a static stand-in — the button exists, is styled correctly, and does nothing (or nothing yet) when clicked. Before a new client build goes live, every "Not built" row above needs one of: a real endpoint wired to it, or — if that feature genuinely isn't needed for that client yet — the control removed rather than left as a dead click. A dashboard should never ship with a button that visibly does nothing when a client tries it.
