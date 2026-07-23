


# Fuel Finance — Vercel Client Dashboard: Design & Build Rules

**Purpose:** this is the standard every FM (or anyone building for an FM) follows when spinning up a new client dashboard on Vercel, or adding a page/tab/widget to an existing one. It exists so that a Dashboard tab looks the same whether it was built for client A in January or client B in July. It is the web counterpart to `fuel-file-design` (which covers Docs/Sheets/Excel) — use that skill for spreadsheet/document deliverables, use this one for anything that renders as a web page.

Reference build: `fuel-finance-design-template.html` (Acme Inc. example). When in doubt, open that file and copy the pattern rather than inventing a new one.

---

## 1. Visual Foundations

### Theme
Light mode only. White/off-white canvas, near-black chrome (topbar, tab nav, table headers, footer, total rows). Never invert this — the dark elements are structural chrome, not a dark-mode toggle.

**Fonts**
| Use | Font |
|---|---|
| All UI text — labels, headings, body, buttons, badges | `Space Grotesk` |
| All numeric/tabular data — KPI values, table numbers, deltas, percentages | `Inter`, with `font-variant-numeric: tabular-nums` (`font-feature-settings: 'tnum' 1, 'lnum' 1`) so digits align in columns |

Load both via Google Fonts: `Space+Grotesk:wght@400;500;600;700` and `Inter:wght@400;500;600;700`.

**"FUEL" wordmark** — the real logo asset (`public/logo-black.svg` on a white pill for the topbar/footer chrome; `public/logo-white.svg` if it ever needs to sit directly on black), never text set in a display font. Don't recreate the wordmark with CSS/a font — it's an image, dropped in via `<img>`.

**Percentages** — every percent figure anywhere in the product (KPI cards, table cells, deltas, chart labels/titles) renders to exactly **2 decimal places** (`value.toFixed(2)`), never 0 or 1. This also guards against the class of bug where a non-percent value (e.g. a raw dollar figure from a fallback row) gets silently formatted with a `%` suffix — always format a percent from a value you've confirmed is actually a percent, never from whatever row a fallback lookup happened to return.

**Months** — every month shown to a reader (chart axes, table column headers, the KPI Report month picker) renders as `MMM-YY` (e.g. `Jan-26`), never a raw ISO string (`2026-01`) and never the un-hyphenated form (`Jan26`). One shared formatter (`formatMonthLabel` in `lib/calc/dashboardMetrics.js`) is the only place this format is defined — don't reimplement it per component.

**Below-benchmark state** — render an attention/warning icon, not the word "Watch". The healthy state stays a green "Healthy" text badge; the at-risk state is icon-only (a glance down a column of icons reads faster than a repeated word). Wherever a benchmark comparison is shown, also show the actual numeric variance (`+$1,247` / `-2.3pts`), not just the healthy/at-risk badge alone — the badge says which side of the line it's on, the number says by how much.

### Color tokens
Define these once as CSS variables at the top of every project and build everything from them — never hardcode a hex value inline.

```css
--bg:#FAFAFA;            /* page canvas */
--panel:#FFFFFF;         /* cards, tables */
--panel-2:#F3F4F6;       /* zebra stripe, subtle fills */
--border:#E5E7EB;
--border-soft:#ECEDEF;

--black:#0A0A0A;         /* topbar, tab nav, table headers, total rows, footer */
--black-2:#161616;
--on-black-muted:rgba(255,255,255,.55);
--on-black-border:rgba(255,255,255,.12);

--green:#2BBC62;   --green-dark:#1E9950;   --green-soft:rgba(43,188,98,.12);
--purple:#864DFE;  --purple-soft:rgba(134,77,254,.10);
--blue:#11B3E7;
--pink:#EC4862;    --pink-soft:rgba(236,72,98,.10);
--teal:#46BDC6;

--text:#111111;
--muted:#6B7280;
--muted-2:#9CA3AF;
```

**What each color means — keep this consistent everywhere:**
- **Green** = positive / favorable / healthy / benchmark met. Used for up-deltas, "Healthy" badges, positive margins, the primary "live" accent (e.g. status dot, primary-button glow).
- **Pink/red** = negative / unfavorable / at risk / below benchmark. Down-deltas that are bad, "Below plan"/"Watch" badges, critical callouts in body copy.
- **Purple** = primary brand accent — profitability/EBITDA charts, the custom-report icon, section accents that aren't strictly "good/bad."
- **Blue** = revenue / primary metric charts.
- **Teal** = margin / secondary supporting charts.
- **Black** = structural chrome only (topbar, nav, table headers, total rows, the "current period" highlight bar in charts). Never use black as a plain data color choice — it always signals "this is chrome" or "this is the period we're looking at."
- A down-delta is not automatically "bad" and an up-delta is not automatically "good" — color by favorability, not direction (e.g. COGS going down is green, revenue going down is red).

### Type scale
| Element | Size / Weight | Color |
|---|---|---|
| Page title (`h1`) | 24px / 700 | `--text` |
| Page subtitle | 13.5px / 400 | `--muted` |
| Section/card heading (`h3`) | 13–15px / 600 | `--text` |
| Chart caption | 11.5–12px / 400 | `--muted-2` |
| KPI card value | 21px / 700, Inter tabular | `--text` |
| KPI card label | 10px / 600, uppercase, letter-spacing .4px | `--muted` |
| Table header | 10.5px / 700, uppercase | white on `--black` |
| Table body | 13px / 400 | `--text`; numeric cells use Inter tabular |

> **Note:** this differs from `fuel-file-design` (Docs/Sheets), where table headers are purple. On the web dashboard, table headers are **black with a green bottom border** — that green underline is the one place purple is *not* used for headers.

### Chart canvas & labeling — applies to every chart, everywhere

These two rules apply to **every chart on every tab** — the KPI Report hero chart, both Dashboard tabs' side-by-side charts, the full-width hero chart, the three small supporting charts, and any chart added later. They are not optional extras for "important" charts only.

- **Fill the container.** A chart is never a small fixed-size canvas floating inside a much larger card with empty space around it. The chart's drawing area must stretch to 100% of the width and height of the card it lives in. Give the card itself an explicit height (or a fixed aspect-ratio) so the chart has something concrete to size against, and mount the chart in a responsive container (e.g. a charting library's `ResponsiveContainer`/`autosize` mode, or an SVG with `viewBox` + `width:100%; height:100%`, not a hardcoded pixel `width`/`height` attribute). If a card renders with visible blank margin around the plotted chart, that is a bug, not a valid smaller-chart style.
- **Charts are a consistent, capped size — never a "hero" that balloons.** A regular chart card (side-by-side pair) gets a fixed height (`320px`); the one full-width hero chart per page (`.chart-panel-lg`) is only modestly taller (`340px`) — a hero chart is never several times the height of a regular one. An explicit height on the card is what keeps this capped; relying on an svg's `height:100%` with no defined ancestor height is what lets a chart balloon in the first place.
- **`preserveAspectRatio="none"` stretches non-uniformly — pick a viewBox that roughly matches the card's real aspect ratio.** "Fill the container" doesn't mean any viewBox works: a chart drawn at a viewBox far narrower or wider than its actual card gets squashed or stretched unevenly, distorting bar widths and — since SVG font sizes are in the same user-unit space — the text along with them. In this codebase that means `TrendChart`'s `viewBoxWidth`/`viewBoxHeight` should be tuned per call site: `640×220` for a half-width chart, `1280×300` for the full-width hero, `420×110` for a third-width mini chart (matching `docs/reference-build.html`) — not one fixed viewBox reused everywhere regardless of the card it ends up in.
- **Small supporting (mini) charts are the one exception to "fill the container."** Force-stretching a sparkline-sized chart to a fixed card height is what squeezes/distorts it when the card is much narrower than a regular chart. Let mini charts size off their own viewBox aspect ratio (`width:100%; height:auto`, no `flex:1`/forced height) instead — see `.chart-panel svg.mini-chart` in globals.css. They still need a `referenceValue` dashed line like every other trend chart — being small doesn't exempt them from that rule.
- **Label every data point.** Every bar and every point on every chart shows its value inline, permanently — not only the reference-line average, and not only on hover. Hover exists to add *context* (the why, the drill-down breakdown) — it never gates the reader from the raw number. A chart with an unlabeled bar and only a labeled average line is incomplete.

---

## 2. Page Structure

Every tab lives inside the same shell. Don't reinvent this per page.

**Topbar** (`position: sticky; top:0`, black background)
- Left: Fuel logo (white rounded pill, stencil wordmark) → thin vertical divider → client breadcrumb: a small green status dot + `Client · **{Client Name}**`.
- Right: user avatar only — a green circle with initials, ringed by the black background. **Do not put a period/date picker in the topbar.** Each tab owns its own period control in its page head (see below) — a global picker duplicates state and was removed from the reference build for that reason.

**Tab navigation** — a black, pill-shaped segmented control, sticky just under the topbar, floating over a fade gradient. Each tab is an icon + label button; the active tab gets a white pill background with black text. Standard tab set for a client dashboard:
1. **KPI Report**
2. **Dashboard**
3. **Reports** (may carry a count badge, e.g. number of saved reports)
4. **Custom**

Add tabs to this same control if a client needs a genuinely new page type — don't bury a new page inside an existing tab.

**Page shell** — centered container, `max-width: 1320px`, 32px horizontal padding, 40px bottom padding, **28px top padding**. The top padding is required, not optional — without it the page title sits flush against the sticky tab nav above it.

**Page head pattern** (repeats identically on every tab): an `h1` + one-line muted description on the left; whatever controls/actions belong to that page on the right (`head-actions`). This left/right split is fixed — don't move the title to the right or bury actions on the left.

**Buttons**
| Style | Look | Use for |
|---|---|---|
| `.btn` | white, 1px border, 9px radius | secondary actions |
| `.btn.primary` | black fill, white text, small glowing green dot, lifts on hover | the *one* primary action per page (Generate report, New custom report) |
| `.btn` (Export PDF specifically) | white, 1px border — same as any other secondary action | Export PDF is real (`window.print()` with a print stylesheet that hides app chrome — see functionality-spec.md §1), but it isn't the page's primary action, so it stays white, not black |
| `.chip` | pill, white → black when active | multi-select or single-select filters |
| `.seg` (segmented control) | black pill housing a white "active" button | mutually exclusive toggles (report type, month range, MoM/YoY mode) |
| `.icon-btn` | 28×28 square icon button | row-level actions in a table/list |

**Footer** — black bar: Fuel logo + `Confidential` / `Fuel Finance © {year}` / `fuelfinance.me` links.

---

## 3. KPI Report tab — functional rules

Purpose: a living scorecard of the fixed KPI set a client is measured on (growth, retention, efficiency — not a restatement of the P&L).

**Page head:** title + subtitle, and on the right a `.kpi-controls` black pill containing the comparison-mode toggle (**MoM / YoY**, a `.seg` segmented control — exactly one is ever the obvious white-pill active state, never a plain text-color toggle) plus a month-picker, followed by the page's one primary button (`Export PDF`). The "what am I comparing this month against" control always lives here, top-right — never bury it inside the table. The month-picker is a real dropdown of the trailing 12 months, not a decorative chip — picking one re-renders the hero chart, cards, and table from that month's data (see functionality-spec.md §3 for the data-contract limits on what can and can't be recomputed for a past month).

**Top row — 1.2fr chart : 1fr card grid**
- **Left (chart):** one hero line chart, trailing 12 months, for whichever KPI is currently selected via a small dropdown in the chart header. Always include a dashed benchmark/target reference line with an inline label, and label every data point. Its title follows the same chart-title rule as every other chart (§4 below) — a full sentence stating the finding (e.g. *"New MRR is up 2.2% vs prior month, now at $1,397"*), never just the metric name — and it gets the same hover drill-down (breakdown panel) as a Dashboard hero chart.
- **Right (cards): always exactly 6 KPI cards, 3 columns × 2 rows.** Never 3, never a variable count — pick the 6 metrics that matter most if the client's KPI set is bigger than that. Each card = a 3px colored left accent bar keyed to that metric, an uppercase label, a large Inter-tabular value, a delta or short context note, and a bottom row pairing the benchmark (`Benchmark ≥1.0×`) with a health badge (`Healthy` in green, or the failing state in pink).

**Bottom — full metrics table.** First column (`KPI Metric`) is sticky-left, same as the Reports tables (§5) — it must stay visible while the table scrolls horizontally, **including the section-header band rows, not just regular data rows** (see the implementation note below). The remaining columns are always `{current month, highlighted} | YTD | TTM | Benchmark | vs Benchmark`, plus **one comparison-column group that the MoM / YoY toggle switches between** — this is a real, wired control, not decorative:
- **MoM** → `prior month | MoM Var | MoM %`
- **YoY** → `{same month, prior year} | YoY Var | YoY %`
- Group rows under bold section headers (green-tinted band) — e.g. *Pipeline & Growth*, *Retention & Health*, *Sales Efficiency*. Never leave a metric un-sectioned.
- **Implementation note — section-header rows must NOT use a single `colSpan` cell.** `position: sticky` on a `<td>` with `colspan > 1` doesn't reliably stick (a cross-browser table-layout limitation) — it silently breaks the "stays visible while scrolling" rule for exactly the row most likely to have it tested. Render the section label as its own single-column first `<td>`, followed by a `colSpan={N-1}` filler `<td>` for the rest of the green band. Same rule applies to the Reports tables (§5).
- **Implementation note — the header row is sticky-top too, which is why `.table-wrap` has a bounded `max-height` and its own `overflow-y: auto`.** `overflow-x: auto` (needed for the sticky-left column above) makes `.table-wrap` the nearest scrolling ancestor for any sticky descendant regardless of the y-axis setting — so a header that's meant to stick to the *page* scroll instead only ever sticks within `.table-wrap`'s own scrollport. Giving the table its own bounded height and scrollbar is what makes that scrollport real, the same frozen-header/frozen-column pattern as a spreadsheet.
- Use bold "total"-style rows (black band, green top/bottom border) for the roll-up metric of each section.
- The current-month column always carries the active-column highlight: a green tint (`--green-soft`) on normal rows, and on black total rows a subtle green-tinted overlay instead (e.g. `rgba(43,188,98,.16)` over the black background) — never a plain white cell dropped onto a black row, and never a highlight that hides the number. This is how the reader's eye finds "the month we're discussing" in a wall of numbers.
- **The current-month cell always shows its value — on every row type, including total rows.** A blank/empty cell in the current-month column is a rendering bug, never an acceptable state. Only cells with no meaningful YTD/TTM/benchmark value get a muted em dash (`—`); the current-month figure itself is never missing.

---

## 4. Dashboard tab — chart & widget rules

This is the page people actually screenshot for the board, so these rules matter most.

**Executive Summary** — a card with a green left border and a single spark icon, labeled `Executive Summary — {Month}`, containing **one paragraph** (not bullets) that states the top 2–3 findings in plain language, with the single most urgent item bolded in pink. This is a narrative sentence, not a stat dump.

**Summary cards row** — six cards across. The first card is always solid black (the headline number, usually Revenue); the rest are white cards with label/value/delta.

**Chart title rule — the most important one.** Every dashboard chart title must be a complete, meaning-bearing sentence that states the finding, never just the metric's name.
- ✅ *"Revenue dropped 11% in May on lower Physical volume"*
- ✅ *"Gross Margin improved to 51.4%, above the 50% target"*
- ❌ *"Revenue"* / *"Monthly Revenue Chart"*

Directly under the title, a muted caption states the chart's time window and, if the chart is interactive, the interaction hint — e.g. *"Monthly revenue vs 6-month average · hover the last bar for detail."*

**Current/selected month rule.** The bar or point for the month being reported on is always rendered solid black. Every other (historical) bar/point uses that metric's assigned accent color at low-opacity fill with a matching stroke. Black = "this is the month we're talking about"; color = history/context. Never highlight a month with anything other than black, and never leave the current month the same color as the rest.

**Reference line rule.** Every trend chart carries exactly one dashed horizontal reference line with an inline text label — the trailing average, a target, or breakeven (e.g. `Avg $3,052K`, `Target 50.0%`, `Breakeven $0`). Use `--muted-2` for a neutral average/breakeven line, `--pink` for a risk threshold. This line is what the reader benchmarks the bars against — a trend chart without one is incomplete. The label is pinned to the far-left margin, outside the plotted data, and sits just *below* the line — data-point labels are always drawn *above* their point, so this is what keeps the two from colliding regardless of where the line falls in the chart.
- **When a metric has more than one meaningful comparison** (e.g. trailing average *and* a benchmark/plan figure), let the reader switch between them with a small toggle above the chart instead of only ever showing one — `TrendChart`'s `referenceOptions` prop takes care of this: pass one entry for a fixed reference line, 2+ to get the toggle for free. Don't invent a second reference line rendered at the same time — it's still exactly one line, just switchable.

This applies on top of, not instead of, the universal chart rules in §1: the reference line's label is *in addition to* every bar showing its own value, not a substitute for it — a chart with only the average labeled and every bar unlabeled is incomplete, whether it's the full-width hero chart or one of the three small supporting charts.

**Color-per-metric rule.** Each metric family keeps the same color everywhere it appears on the dashboard:
- Revenue → blue (`--blue`)
- Margin → teal (`--teal`)
- EBITDA / profitability → purple (`--purple`)
- Cash / positive trend lines → green (`--green`)

Don't pick a color per-chart on a whim — pick it once per metric and reuse it in every chart, mini-chart, and card that shows that metric.

**Drill-down rule.** The highlighted (black) bar is hoverable. On hover, a drill panel opens over the chart with a component breakdown (a simple label/value list) and one italic calc-note stating the exact formula/basis, e.g. *"Calculated as: (Revenue − COGS) / Revenue, on the May 2026 P&L."* — include a "vs prior month" percentage as one of the rows where a prior figure exists, not just the raw components. Keep this to the one panel; an earlier version of this pattern also had a green speech-bubble annotation callout floating over the same corner, and the two competed for the same space — don't bring that back.

Every hero chart needs a drill panel — a viewer should never have to ask "how was this calculated" without the answer being one hover away.

**Layout:** two side-by-side charts, then one full-width hero chart (typically EBITDA or cash), then a row of three small supporting charts (a trend line, a new-vs-churned comparison, and an aging/composition donut). Don't stack more than one full-width hero chart per page — if there are two headline stories, they go side by side at half-width instead.

---

## 5. Reports tab — report document rules

**Controls, top of page:** a report-type segmented control on the left (**P&L / Cash Flow / Balance Sheet / Custom**) and a month-range segmented control on the right (**6M / 12M / 24M**). Exactly one report is visible at a time; switching either control swaps content in place — never navigate away from the Reports tab to view a different statement.

**Each report is a document card:**
- Header row: report name + a meta line (generation timestamp + a status badge — `Ready` green, `In Review` purple, `Scheduled` teal, `Draft` gray) on the left; a single **Export** button on the right. There is no separate "view" action — Export is the only row-level control.
- Table: the first column (**Account / Line Item**) is sticky-left, and the header row is sticky-top (both KPI Report and Reports tables scroll inside a bounded-height `.table-wrap` for exactly this reason — see the sticky-column implementation note in §3).

**Critical rule — never let the range toggle hide row labels.** The 6M/12M/24M toggle works by hiding month *columns* that don't belong to the selected range. Every category label, line-item name, and total-row name in the first column must be tagged as belonging to **every** range (so it's never hidden), while every numeric month-column cell is tagged only with the range(s) it belongs to. Getting this backwards — as happened in an earlier build of this template — makes every row's numbers show up with no visible label for what they are. When building a new report table, the checklist is: *"if I switch to 6M, can I still read every category name and every total-row name?"* If not, the label column is missing its always-visible tag.

**Row styling — identical across P&L, Cash Flow, and Balance Sheet:**
- Section header rows: full-width, green-tinted, bold, uppercase band (e.g. *Revenue*, *Operating Activities*, *Current Assets*).
- Regular rows: zebra-striped white / light-gray.
- Total/subtotal rows: solid black band, green top and bottom border, with green/pink-tinted deltas inside it.
- The current reporting-period column always carries the active-column highlight, exactly as in the KPI table, so the reader can find "this month" the same way on every page of the dashboard.

**Custom / ad-hoc reports** (e.g. an AR Aging summary) skip the month-range toggle entirely and use whatever columns the report actually needs (aging buckets, customer names, etc.) — the sticky, always-visible label-column rule still applies.

**Custom tab** (the report-builder landing page) is a simple empty state until reports are saved: an icon, a one-line "no custom reports yet" message, a short explanation of what can be built, and a single primary "New custom report" button — don't decorate it with fake charts before there's real content to show.

---

## 6. Quick checklist before shipping a new client page

- [ ] Colors and fonts pulled from the token list above — nothing hardcoded or "close enough"
- [ ] Topbar has logo (the real `public/logo-*.svg` asset, not text set in a font) + client name + avatar only — no period picker
- [ ] Page shell has its 28px top padding — the title never sits flush against the tab nav
- [ ] Every chart fills 100% of its card's width and height — no chart floating small with empty space around it
- [ ] Every chart card has an explicit, capped height — regular charts and the one hero chart per page are all roughly the same size, never a chart that balloons
- [ ] Every chart title is a full sentence stating the finding, not a label — this includes the KPI Report hero chart, not just Dashboard charts
- [ ] Every bar/point on every chart is labeled with its value — not only the reference line, not only on hover
- [ ] The month being reported on is black in every chart; every other month uses the metric's assigned color
- [ ] Every trend chart has one dashed, labeled reference line
- [ ] Every hero chart has a hover drill-down with a calc-note — including the KPI Report hero chart
- [ ] Every percentage anywhere in the product is formatted to exactly 2 decimal places
- [ ] The KPI Report shows exactly 6 KPI cards next to the hero chart, and its MoM / YoY `.seg` toggle actually changes which comparison columns the table shows
- [ ] The KPI Report's month picker is a real dropdown that re-renders the chart/cards/table, not a decorative chip
- [ ] The current-month column always shows a value with its highlight tint, on every row type including black total rows — never a blank cell
- [ ] The metric/line-item column is sticky-left in every table (KPI Report and Reports alike) and stays visible while scrolling horizontally — **including section-header band rows** (built as a single-column cell + colSpan filler, never one colSpan cell for the whole row)
- [ ] Every chart's viewBox width/height roughly matches its card's actual aspect ratio — a viewBox far narrower or wider than the container distorts bars and text when stretched to fill it (design-rules.md §1 "fill the container" is not license to stretch non-uniformly)
- [ ] The small supporting charts size off their own aspect ratio (`height: auto`), not a forced 100%-height stretch — that combination is what squeezes/distorts a chart that's much narrower than the regular ones
- [ ] Every report table's category/line-item column stays visible at every range-toggle setting
- [ ] Every table's header row is sticky-top (not just the label column sticky-left) — `.table-wrap` needs its bounded `max-height` + `overflow-y: auto` for this to actually stick, not just `position: sticky` on the `<th>`
- [ ] Every month shown to a reader uses `MMM-YY` (`Jan-26`) via the shared `formatMonthLabel` — never a raw ISO string, never the un-hyphenated form
- [ ] The below-benchmark state is an icon, not the word "Watch"; every benchmark comparison shows the actual numeric variance next to it, not just the healthy/at-risk badge alone
- [ ] Export PDF actually does something (`window.print()` + the print stylesheet) and is a plain white `.btn`, not the page's black `.btn.primary`
- [ ] Exactly one primary (black) button per page
- [ ] Section rows and total rows follow the green-band / black-band convention, not ad hoc styling

**Do:**
- Reuse the reference build's class names and structure rather than inventing new ones for the same purpose.
- Keep every color choice traceable to "positive/favorable" (green), "negative/at risk" (pink), or "structural chrome" (black).

**Don't:**
- Don't switch the shell to dark mode — the black elements are chrome, not a theme.
- Don't add a second global period picker — periods live inside each page's own head-actions.
- Don't title a chart with just a metric name, and don't leave a trend chart without a reference line.
- Don't ship a chart that doesn't fill its card, or that leaves any bar/point unlabeled — and don't leave a total row's current-month cell blank.
