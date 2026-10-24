---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/components/layout.tsx","src/components/app-sidebar.tsx"]
---

# Surface: office app shell and all screens (redesign)

Mode: Operate. Users and jobs: see PRODUCT.md. Scope: the whole app (office screens, sign-in, collector phone screens), one visual language.

Pinned by the user (2026-10-24): follow the Mercury banking app references they shared (transactions list, transaction side panel, add-member dialog, home). Nothing of the old navy/red/IBM Plex look must stay. Rows open a detail panel on the right; full pages stay for the client profile and new loan. Code-led (Operate surface). Taste-skill app style: achromatic-ledger, seed 660154299.

## Direction contract

THESIS: a quiet ledger the office works in all day; every peso figure carries the weight, the chrome carries none. Refuses the navy-sidebar admin template with card grids and coloured badges.
OWN-WORLD: blue-grey sidebar ground (#f6f7f9) beside a white canvas, ink #0a0a0a, greys #6b6b6b, hairlines #e6e6e6/#f0f0f0, near-black primary, one blue #1d5fbf on the main data element and name links, money-in green #2e7d32 with a plus sign. Geist throughout, Geist Mono for IDs only. Radii 8/6, circles for people. Amounts show centavos raised and small, Mercury style.
STORY: staff open the app onto their own work (Encode Payments, Loans, Daily target), scan a list, click a row, read and act in the side panel without losing the list.
FIRST VIEWPORT: 24px noun title with the role's one primary action at the right of the title row; a row of filter chips; a divided summary strip of the list's totals; the table starting above the fold; top bar holds the ⌘K search and the account menu.
FORM: Mercury-style open-plane banking shell (user-pinned, position 1; the roll dealt Metro tiles and a jet-age ticket wallet as challengers, both declined: a pinned brief beats the roll). seed:c76a91d15fbb3c27
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
