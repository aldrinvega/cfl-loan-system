---
name: Cash Flow Lending
description: A quiet achromatic ledger for a Philippine micro-lender's office and field staff; the peso figures carry the weight, the chrome carries none.
colors:
  canvas: "#ffffff"
  ink: "#0a0a0a"
  primary: "#141414"
  primary-hover: "#373737"
  primary-ink: "#ffffff"
  sidebar-ground: "#f6f7f9"
  sidebar-ink: "#3d3d3d"
  sidebar-active: "#e9eaed"
  hover-wash: "#f2f3f5"
  secondary-fill: "#eeeeee"
  muted-ink: "#6b6b6b"
  border: "#e6e6e6"
  row-rule: "#f0f0f0"
  control-border: "#d4d4d4"
  data-blue: "#1d5fbf"
  money-in: "#2e7d32"
  destructive: "#c4242a"
  destructive-wash: "#f9e9ea"
  chart-faint: "#e5e5e5"
  chart-grey: "#b8b8b8"
  pill-neutral: "#eeeeee"
  pill-neutral-ink: "#3d3d3d"
  pill-positive: "#dcfae5"
  pill-positive-ink: "#04250e"
  pill-negative: "#ffedea"
  pill-negative-ink: "#831c1e"
  pill-warning: "#fffbeb"
  pill-warning-ink: "#92400e"
  dark-canvas: "#0f0f0f"
  dark-card: "#161616"
  dark-popover: "#1b1b1b"
  dark-sidebar-ground: "#0a0a0a"
  dark-ink: "#f5f5f5"
  dark-muted-ink: "#a3a3a3"
  dark-border: "#2a2a2a"
  dark-row-rule: "#202020"
  dark-control-border: "#3d3d3d"
  dark-data-blue: "#6f9ee6"
  dark-link: "#8db4f0"
  dark-money-in: "#3fc07a"
  dark-destructive: "#e5566f"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: "32px"
    letterSpacing: "-0.02em"
  figure-kpi:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  figure-strip:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: "28px"
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.375
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    fontFeature: "tnum"
  body-strong:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
  caption:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
rounded:
  sm: "4.8px"
  control: "6.4px"
  pill: "5px"
  card: "8px"
  full: "9999px"
spacing:
  gutter-phone: "16px"
  gutter-desktop: "32px"
  page-stack: "24px"
  panel-pad: "24px"
  cell-x: "12px"
  strip-split: "40px"
  facts-row: "10px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-outline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.hover-wash}"
  button-secondary:
    backgroundColor: "{colors.secondary-fill}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.hover-wash}"
    textColor: "{colors.ink}"
  button-destructive:
    backgroundColor: "{colors.destructive-wash}"
    textColor: "{colors.destructive}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "40px"
  button-link:
    textColor: "{colors.data-blue}"
    height: "40px"
  button-sm:
    typography: "{typography.label}"
    padding: "0 12px"
    height: "40px"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "4px 12px"
    height: "40px"
  pill-neutral:
    backgroundColor: "{colors.pill-neutral}"
    textColor: "{colors.pill-neutral-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "2px 6px"
    height: "20px"
  pill-positive:
    backgroundColor: "{colors.pill-positive}"
    textColor: "{colors.pill-positive-ink}"
    rounded: "{rounded.pill}"
    height: "20px"
  pill-warning:
    backgroundColor: "{colors.pill-warning}"
    textColor: "{colors.pill-warning-ink}"
    rounded: "{rounded.pill}"
    height: "20px"
  pill-negative:
    backgroundColor: "{colors.pill-negative}"
    textColor: "{colors.pill-negative-ink}"
    rounded: "{rounded.pill}"
    height: "20px"
  table-head:
    textColor: "{colors.muted-ink}"
    typography: "{typography.caption}"
    padding: "0 12px"
    height: "36px"
  table-row:
    typography: "{typography.body}"
    padding: "8px 12px"
    height: "44px"
  table-row-hover:
    backgroundColor: "{colors.sidebar-ground}"
  table-row-selected:
    backgroundColor: "{colors.sidebar-active}"
  card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  detail-panel:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    padding: "24px"
    width: "420px"
  nav-item:
    textColor: "{colors.sidebar-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  nav-item-active:
    backgroundColor: "{colors.sidebar-active}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
  person-avatar:
    backgroundColor: "{colors.sidebar-active}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "28px"
  top-bar:
    backgroundColor: "{colors.canvas}"
    padding: "0 32px"
    height: "64px"
---

# Design System: Cash Flow Lending

## Overview

**Creative North Star: "The Quiet Ledger"**

The office works in this app all day, so the system is built to disappear around the money. Chrome is achromatic: a white canvas beside a pale blue-grey sidebar ground, near-black ink, grey for everything secondary, and hairlines instead of boxes. The only weight on any screen belongs to peso figures, set in medium Geist with their centavos raised and small, so a column of amounts reads like a printed ledger rather than a spreadsheet. The world follows the Mercury banking references the owner chose; nothing of the earlier navy-and-red admin look, IBM Plex type, card grids or rainbow badges survives.

Density is desk-grade: 14px body, 44px table rows, 40px controls everywhere (a client requirement). Staff open onto their own work, scan a list, click a row and read or act in a right-hand detail panel without losing the list. Colour is spent only where it means something: one data blue for the main chart line, timeline progress, name links and focus; one green for money coming in; pale status pills only on rows that need someone to act.

The dark theme is true neutral, not navy: elevation by lightness (#0a0a0a sidebar, #0f0f0f canvas, #161616 cards, #1b1b1b popovers), the same single blue lifted for contrast.

**Key Characteristics:**
- Achromatic chrome; ink carries the money, one blue carries the data.
- Raised, small centavos on every amount; tabular figures everywhere.
- Hairline-split summary strips, never boxed KPI cards.
- Flat at rest; shadows exist only on overlays.
- Every row opens a right-side detail panel; full pages only for the client profile and new loan.
- One family (Geist) at three weights in practice: 400, 500, and 600 for the logo monogram only.

## Colors

A near-monochrome ledger with two meaning-carrying hues and a set of pale status pairs.

### Primary
- **Ledger Black** (#141414, `primary`): primary buttons, the sidebar monogram tile, the selected tab underline. Hover lifts to #373737 (85% over white). White text on it.
- **Ink** (#0a0a0a, `ink`): all body text and every amount. Money is never grey unless it is secondary (interest column, cancelled receipts).

### Secondary
- **Ledger Blue** (#1d5fbf, `data-blue`): the one blue. The main data element of a screen (the "Collected" chart line, chart-4), filled timeline steps, client-name links, the focus ring, text selection tint. Dark theme: #6f9ee6 for data and ring, #8db4f0 for links.

### Tertiary
- **Money-In Green** (#2e7d32, `money-in`): amounts coming in, always with a leading plus sign (`signed` + `positive`), the "Day open" dot, the balanced check. Dark: #3fc07a.
- **Correction Red** (#c4242a, `destructive`): destructive buttons as a 10% wash (#f9e9ea) with red text, invalid fields. Dark: #e5566f.

### Neutral
- **Canvas White** (#ffffff, `canvas`): page, cards, inputs, popovers, the detail panel.
- **Blue-Grey Ground** (#f6f7f9, `sidebar-ground`): the sidebar, row hover, the quiet balanced notice.
- **Pressed Grey** (#e9eaed, `sidebar-active`): active nav item, selected row, person initials circles.
- **Hover Wash** (#f2f3f5, `hover-wash`): outline and ghost button hover, menu highlight.
- **Fill Grey** (#eeeeee, `secondary-fill`): secondary buttons and neutral pills.
- **Ledger Grey** (#6b6b6b, `muted-ink`): descriptions, column headers, sub-lines, stat labels, icons in the nav.
- **Sidebar Ink** (#3d3d3d, `sidebar-ink`): nav labels at rest.
- **Hairline** (#e6e6e6, `border`): card and panel edges, header rules, summary-strip splits, chart gridlines.
- **Row Rule** (#f0f0f0, `row-rule`): the fainter line between table rows and between facts.
- **Control Edge** (#d4d4d4, `control-border`): outline buttons and inputs, one step darker than hairlines so controls read as touchable.
- **Chart greys** (#e5e5e5, #b8b8b8): background series; the target line is #b8b8b8 dashed.

Status pills are pale pairs: neutral #eeeeee/#3d3d3d, positive #dcfae5/#04250e, warning #fffbeb/#92400e, negative #ffedea/#831c1e.

**The One Blue Rule.** There is exactly one chromatic accent in the chrome, Ledger Blue, and it marks data and links, never decoration. A second blue, a tinted sidebar or a coloured header is off-system.

**The Action-Only Colour Rule.** Status colour appears only where someone must act: amber for "For approval" and arrears, red for past due, cancelled and not balanced, green for "Approved, to release" and updated. Settled states (Released, current, dormant) are plain grey text or a neutral pill.

**The Plus-Sign Green Rule.** Green means money arriving and always travels with a "+". It is never a success colour for buttons or banners.

## Typography

**Display Font:** Geist (with system-ui, sans-serif)
**Body Font:** Geist (with system-ui, sans-serif)
**Label/Mono Font:** Geist Mono (with ui-monospace), loaded at 400/500 but reserved for literal strings a user types (e.g. the demo password hint)

**Character:** One neutral grotesk does everything; hierarchy comes from size and the 400/500 step, with slight negative tracking on anything 20px and up. Tabular figures are on at the root, so every column of numbers aligns.

### Hierarchy
- **Display** (500, 28px, 1.25, -0.02em): the Dashboard greeting and a detail panel's lead figure (the loan amount at the top of the panel).
- **Figure KPI** (500, 26px, 1, -0.02em): the four Dashboard KPI values.
- **Headline** (500, 24px, 32px, -0.02em): every page's noun title ("Loans", "Encode Payments").
- **Figure Strip** (500, 20px, 28px, -0.01em): values in a summary strip.
- **Title** (500, 16px): card titles, panel and dialog titles.
- **Body** (400, 14px, 20px): table cells, facts, descriptions, nav labels; names and IDs in rows at 500.
- **Label** (400, 13px): stat-strip and KPI labels, `sm` button text.
- **Caption** (400, 12px): table column headers in sentence case, sub-lines under names (loan IDs, "12 weekly"), pills.

**The Raised Centavos Rule.** Every peso amount renders through the money component: pesos at the line's size, centavos at max(0.64em, 11px), raised 0.42em, never below the 11px floor. Amounts never wrap. A bare "1,234.56" string in a figure position is off-system.

**The One Family Rule.** Geist sets the whole product, IDs included (loan IDs and OR numbers are Geist tabular, not mono). Geist Mono is held back for literal, type-this-exactly strings.

**The Sentence Case Rule.** Headers, labels, tabs and buttons are sentence case at 12-14px. No uppercase tracking labels.

## Layout

A labelled sidebar (blue-grey ground, hairline edge) beside a white canvas. The canvas has a 64px sticky top bar holding the Ctrl+K client search (up to 448px wide), the business-day status ("Day open · weekday date", from 1024px), the role's one primary job as an outline button (Encode payment or New loan) and the account menu circle. Below it, content sits in a column capped at 1360px with a 32px gutter (16px on phones), 16px top padding and 24px between blocks.

A list screen stacks: page header (24px title, one grey line, actions right), a summary strip, a line of underline tabs with counts, then the table, so the table starts above the fold. The Dashboard uses open-plane sections: cards with no border, fill or padding, so the title, figures and plot share one left edge; at 1280px it splits into a fluid main column and a 380px side column, gap 24px.

Summary strips are a single block between two hairlines, split by vertical hairlines with 40px either side; the Dashboard KPI strip goes 1-up, 2-up at 640px, 4-up at 1280px with 24px splits. On phones a strip becomes a 2-up grid.

Tables: cells 12px horizontal padding (8px on phones), numbers right-aligned under right-aligned headers, secondary columns hidden below 768px, a row action cell hidden below 640px.

Phone (below 768px): the sidebar folds into a sheet opened from a trigger in the top bar; search and the primary job collapse to 40px icon buttons; initials circles hide below 640px. The detail panel goes full width.

**The Hairline Not Box Rule.** Group figures with hairlines and whitespace, not containers. A row of bordered KPI cards is off-system.

**The List Stays Rule.** Clicking or pressing Enter on a row opens its detail on the right (420px); the list stays put underneath. Only the client profile and the new-loan form are full pages.

## Elevation & Depth

Flat. Surfaces at rest have no shadow; depth comes from the ground change (sidebar #f6f7f9 vs canvas #ffffff), hairlines, and in dark mode from lightness steps. Shadows appear only on things that float over the page.

### Shadow Vocabulary
- **Panel lift** (`box-shadow: 0 16px 48px -12px rgb(0 0 0 / 0.18)`): the right-hand detail panel and other sheets, over a 6% black backdrop (40% in dark).
- **Dialog lift** (`box-shadow: 0 24px 64px -16px rgb(0 0 0 / 0.25)` plus a 1px ink-at-10% ring): centred dialogs, over a 20% black backdrop.

**The Flat At Rest Rule.** Nothing in the page plane carries a shadow; if it does not overlay the page, it does not cast one.

## Shapes

Gently rounded, small radii from one 8px base: cards and dialogs at 8px; buttons, inputs, nav items, the search field and notices at 6.4px (0.8 of the base); status pills at a tighter 5px; people (initials circles, account avatar) as full circles. Lines are 1px everywhere: #e6e6e6 for edges, #f0f0f0 between rows, #d4d4d4 for control edges. Timeline dots are 11px circles with a 2px edge on a 1px spine.

**The Circles Are People Rule.** Full rounding is reserved for people (and the tiny status dot). Buttons and pills stay rectangular-soft.

## Components

### Buttons
Restrained and solid; the press is felt rather than seen.
- **Shape:** gently rounded (6.4px), 40px tall at every size the app uses; `sm` only tightens padding to 12px and type to 13px. Icon buttons are 40px squares.
- **Primary:** Ledger Black fill, white 14px/500 text, 14px side padding; hover to 85%.
- **Outline:** white with the 1px control edge, ink text; hover to the hover wash. The role's primary job in the top bar is an outline button.
- **Secondary / Ghost:** fill grey #eeeeee, or transparent with the hover wash on hover.
- **Destructive:** red text on a 10% red wash, never a solid red block.
- **Link:** Ledger Blue text, underline on hover.
- **Focus:** border turns blue with a 3px blue ring at 25%.
- **Press:** scale(0.97), 160ms with cubic-bezier(0.23, 1, 0.32, 1), on colour, border and transform; disabled at 50% opacity with no press; under reduced motion the scale is dropped.

### Chips (status pills)
- **Style:** 20px tall, 5px radius, 12px/500 text, 6px side padding, no border, pale pair fills (see Colors).
- **State:** neutral for KYC and "Today", warning for "For approval" and arrears, positive for approved and updated, negative for cancelled and past due. Released shows as grey text, not a pill.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** canvas white with a 1px hairline; 20px internal spacing (16px for the small size).
- **Shadow Strategy:** none (Flat At Rest).
- **Open plane:** on the Dashboard, cards drop border, fill and padding entirely and read as sections on the canvas.

### Inputs / Fields
- **Style:** 40px, white, 1px control edge (#d4d4d4), 6.4px radius, 12px side padding, 14px text (16px below 768px so phones do not zoom), grey placeholder.
- **Focus:** border to Ledger Blue with a 3px blue ring at 20%.
- **Error / Disabled:** red border with a 3px red ring at 20%; disabled at 50% opacity on a control-grey wash.

### Navigation
- **Sidebar:** blue-grey ground; a 28px black monogram tile with the company name and branch at the top; items 32px tall on a 34px pitch, 14px sidebar ink with 16px outline icons at 1.75 stroke in grey; hover and active on #e9eaed with 6.4px radius, active text in ink at 500 and its icon in ink. "Sample data for preview only." sits at the foot. Collapses to icons; on phones it is a sheet.
- **Tabs (list filters):** underline tabs on a hairline, 14px/500 at 60% ink, active in ink with a 2px ink underline, each followed by its grey count.

### Tables
- **Header:** 36px, 12px grey sentence-case, weight 400, a hairline beneath.
- **Rows:** 44px minimum, #f0f0f0 rules, last row unruled; hover to the blue-grey ground over 150ms; the open row stays on #e9eaed.
- **Figures:** right-aligned, tabular, raised centavos; a secondary amount column in grey; the peso sign dropped inside a column whose header names the unit.
- **People:** a 28px initials circle, the name at 500 and a 12px grey sub-line (the loan ID).

### Detail Panel (signature)
The Mercury-style right panel every list row opens. 420px wide, full height, white, hairline left edge, Panel lift shadow. Header: 16px/500 title (ID · name) and a grey line, 24px padding, hairline below. Body: a Display lead figure with a grey status line, then a Timeline (blue filled dots and spine for steps done, grey ring for steps pending) and Facts (grey label left, tabular value right, 10px rows on #f0f0f0 rules). Footer pins the actions at the right, hairline above. Motion: enters by sliding from fully off-screen with fade over 300ms on cubic-bezier(0.32, 0.72, 0, 1); leaves in 150ms ease-out, travelling only 24px while fading. Reduced motion keeps the fade and drops the travel.

### Summary Strip (signature)
Figures between two hairlines, divided by vertical hairlines: 13px grey label over a 20px/500 value (26px on the Dashboard KPI strip, with a grey note beneath).

### Line Chart
240px tall, horizontal gridlines only in hairline grey, no axis lines or tick marks, 12px grey ticks. The collected series is a 2px Ledger Blue line; the target is a 1.5px dashed grey (#b8b8b8) line; the hover guide is a grey 3-3 dash. No area fill.

### Balance Notice
A 6.4px-radius block with 14px padding: blue-grey ground with a green check when the receipts balance, the pale red pair with an alert icon when they do not.

## Do's and Don'ts

### Do:
- **Do** render every peso amount with raised centavos at max(0.64em, 11px) and tabular figures.
- **Do** keep every button and input 40px tall; reach for `sm` only to tighten padding.
- **Do** open row detail in the 420px right panel, entering at 300ms on cubic-bezier(0.32, 0.72, 0, 1) and leaving at 150ms.
- **Do** split summaries with #e6e6e6 hairlines and 40px of air instead of boxing them.
- **Do** spend Ledger Blue (#1d5fbf) only on the main data series, name links, timeline progress and focus.
- **Do** mark money coming in with green (#2e7d32) and a leading "+".
- **Do** set settled states such as Released in plain grey text.
- **Do** give every pressable control the 0.97 press at 160ms, with the reduced-motion fallback.

### Don't:
- **Don't** bring back the retired navy sidebar, red accents or IBM Plex Sans.
- **Don't** use rows of bordered KPI cards or card grids for figures.
- **Don't** put a shadow on anything that sits in the page plane; shadows are for sheets and dialogs only.
- **Don't** colour a status that needs no action.
- **Don't** add a second accent hue, a tinted header or a gradient to the chrome.
- **Don't** use uppercase tracked labels or eyebrow text above titles.
- **Don't** round buttons or pills fully; full circles are for people.
