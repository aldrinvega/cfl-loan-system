# Cash Flow Lending Corporation: shadcn/ui version, work summary

What has been built in `app-shadcn/` so far, how it behaves, and what is still open.
All names, loan IDs and amounts are fictional sample data. Status as of October 23, 2026.

`app-shadcn/` is the version being developed. It is built entirely from shadcn/ui components, with
the shadcn CSS variables set to the design README tokens. `../app/` (the first, pixel-matched build
of the original mockups) is no longer updated.

## Client preview

The app is live for client checking at **https://aldrinvega.github.io/cfl-loan-system/**
(public repo: https://github.com/aldrinvega/cfl-loan-system).

- **Hosting**: GitHub Pages, published by GitHub Actions (`.github/workflows/deploy.yml`).
- **Updates**: every push to `main` installs, runs the tests, builds and republishes, in about a
  minute. A failing test stops the deploy, so the client never gets a broken build.
- **Links**: share the main link. Direct links such as `.../cfl-loan-system/payments/new` open
  the right screen, but GitHub returns them with a "not found" status code (they're served by
  the `404.html` fallback), which some link previews show as an error.
- **Data**: each viewer has their own copy in the browser; nothing entered is shared, and a reload
  resets it. "Keep me signed in" and the Dashboard setting are per browser.
- **Access**: anyone with the link can open it, and the repo, including the company name, is
  public. The sign-in is demo-only, and every name and amount is fictional.

## How to run

```sh
cd app-shadcn
npm install
npm run dev      # http://localhost:5173
npm test         # 32 tests
npm run build
```

Sign in with one of the sample accounts. All use the password `cashflow123`.

| Username | Who | Lands on |
|---|---|---|
| `msantos` | M. Santos (Mila), Accounting officer, Sindalan Branch | Encode Payments |
| `acruz` | A. Cruz (Andrea), Loan officer, Sindalan Branch | Loans |
| `tnaguit` | T. Naguit (Tanya), President, all branches | Daily target of collectors |
| `rlacson` | R. Lacson (Ramon), Collector 03 | Phone screens (view only) |

When **Utilities → Settings → Show the Dashboard** is on, office staff land on the Dashboard instead.

## Roles

There is no cashier role. Four roles, with duties split so no one does the other's job:

| | Accounting officer | Loan officer | President | Collector |
|---|---|---|---|---|
| Encode Payments, cancel receipts | ✓ | | | |
| File new loans | | ✓ | | |
| Approve loans | | ✓ | ✓ | |
| Release loans (creates the DV) | ✓ | | | |
| Loans list, Clients | ✓ | ✓ | ✓ | |
| Cash Receipts, Collections, Disbursements, Safekeeping | ✓ | | ✓ | |
| Daily target, Loan ledger, Aging | ✓ | ✓ | ✓ | |
| Day close | ✓ | | | |
| Settings | ✓ | | ✓ | |
| Phone screens (own route, view only) | | | | ✓ |

- The menu, report tabs, report list, Utilities and buttons (New payment, New loan, Approve,
  Release, Cancel receipt, Collect) only show what the role can do.
- Opening another role's screen by its address shows a "No access" page with a link to the
  user's start page.
- Start pages: Accounting officer → Encode Payments, Loan officer → Loans, President → Daily
  target, Collector → phone Today (office roles land on the Dashboard instead when it's turned on).
- The Dashboard adapts: the loan officer sees loans for approval and "New loan" shortcuts; the
  accounting officer sees cash received and Encode Payments shortcuts; the President sees the
  portfolio across branches.
- The whole table lives in `src/state/permissions.ts`.

## Stack and look

- React 19, TypeScript, Vite, React Router; Vitest and Testing Library for tests
- Tailwind CSS v4 and shadcn/ui components (Base UI): Alert, Avatar, Badge, Breadcrumb, Button,
  Card, Chart, Checkbox, Command, Dialog, Dropdown Menu, Empty, Field, Input, Input Group, Item,
  Kbd, Label, Progress, Radio Group, Select, Separator, Sidebar, Sonner, Switch, Table, Tabs,
  Textarea, Toggle Group, Tooltip
- shadcn blocks: `login-03` (sign-in) and `dashboard-01` (section cards, interactive area chart)
- **Look (redesigned after the Mercury references)**: white canvas beside a blue-grey sidebar
  (`#F6F7F9`), ink text `#0A0A0A`, grey `#6B6B6B`, hairlines `#E6E6E6`, near-black buttons
  `#141414`, one blue `#1D5FBF` for links and the main chart line, green `#2E7D32` for money coming
  in, pale status pills. No colour in the chrome, no shadows on anything at rest. Dark mode uses
  true neutral greys. Full record in `DESIGN.md`.
- **Font**: Geist (Google Fonts), tabular numbers; amounts show the centavos small and raised.
- **Controls**: inputs, selects and buttons are 40 px tall, small buttons included.
- **Lists**: Loans, Clients and the Cash Receipts Book open a detail panel on the right when you
  click a row; totals sit in a divided strip above each list.

## Screenshots

All 30 screens are in [`screenshots/`](screenshots/), in light mode, captured at 2x, full length.

| # | Screen |
|---|---|
| 01 | Sign-in |
| 02–03 | Dashboard (with the setting on): accounting officer, President |
| 04–06 | Encode Payments: empty, cash with typed safekeeping, full payment with rebate by check |
| 07–09 | Loans: list (loan officer), new loan with schedule preview, release dialog (accounting officer) |
| 10–19 | Safekeeping, Clients, client profile, Ctrl+K client search, Cash Receipts Book, Disbursements, Utilities, Settings, Day close, Print Reports |
| 20–23 | Daily target (President), Collections, Loan ledger, Aging |
| 24–27 | Collector phone: Today, Clients, client profile, More |
| 28–30 | Loan officer Dashboard, loan officer blocked from Encode Payments, Loans as an accounting officer |

## What was built

### 1. Layout and navigation

- **Sidebar** (shadcn Sidebar): navy, collapses to icons (Ctrl+B or the header button), becomes a
  slide-out panel on phones. The menu follows the legacy system's names and order:

  | Menu item | Opens |
  |---|---|
  | Dashboard | Only when turned on in Settings |
  | Encode Payments | Payment encoding (accounting officer) |
  | Loans | Loan list, new loan, approve, release |
  | Safekeeping | Safekeeping balances report |
  | Clients | Client list and profiles |
  | Cash Receipts Book | Cash Receipts report |
  | Disbursements | Disbursements report |
  | Utilities | Day close, Settings, and two "coming soon" tools |
  | Print Reports | List of every report |

- **Header**: breadcrumb, business date, "Day open" or "Viewing all branches" badge.
- **User menu**: name, role and branch, light/dark switch, sign out.
- **Client search** (Ctrl+K anywhere): find a client by name, client ID or loan no.

### 2. Sign-in (shadcn `login-03` block)

- Username, password with show/hide, "Keep me signed in on this device", "Forgot your password?"
- Sample accounts listed with a "Use" button that fills in the form.
- Wrong password shows tries left; five wrong tries lock the form for 30 seconds.
- Opening a page while signed out goes to sign-in, then back to that page.
- Landing page by role (see Roles above); Dashboard instead for office staff when the setting is on.
- Office staff can't open the phone screens, and collectors can't open the office screens.

### 3. Settings and the Dashboard

- **Settings** (Utilities → Settings): "Show the Dashboard" switch, off by default, saved per
  workstation. When off, the Dashboard disappears from the menu and its address redirects to the
  user's start page.
- **Dashboard** (shadcn `dashboard-01` block), when on: greeting with live clock and business
  day; four section cards (accounting officer: cash received today, collected this week, due in 7 days,
  portfolio at risk; President: outstanding portfolio, collected this week, released this month,
  portfolio at risk); collections vs. target chart; Due soon; Needs attention; latest receipts or
  collectors this week.

### 4. Encode Payments (from `new updates/` mockup 01)

Only accounting officers encode payments. Three steps on one screen:

1. **Collector**: searchable list of routes (01, 02, 03, 04, 06, Office walk-in) with open accounts.
2. **Account**: the route's released loans with dates, type, status (Current or Arrears) and
   amount due today. F2 jumps to the search box.
3. **Payment**: OR number from the collector's booklet (locked until F5 or "Change"); payment and
   effective dates; cash line plus check rows (check no., bank, branch, date); the **payment
   breakdown** (amortization and computed penalty worked out by the system; other penalty and
   **safekeeping typed in by hand**; total; rebate); helper buttons (breakdown of amount received, total due today,
   full payment with rebate, total to cash, total to check). Post only when the breakdown equals
   cash + checks.

- **Account summary** (charges, payments, adjusted, balance, due today, split into amortization,
  penalty and total) and **payment record**.
- Keyboard: F2 find account, F5 change OR no., Enter next field, Ctrl+S post.

### 5. Loans (new)

- **Loan list** with tabs: All, For approval, Approved, Released (with counts). Each row shows the
  product, principal, interest, term, who applied, status (and who approved), and the voucher.
  - **Approve** on a loan waiting for approval (loan officer or President).
  - **Release** on an approved loan opens a confirmation with principal, 3% service fee, 1%
    insurance, net proceeds and the first installment; confirming creates the next disbursement
    voucher (DV), dated the business day (accounting officer).
  - **Ledger** on a released loan opens the client profile.
- **New loan** (loan officer; also from a client profile's "New loan" button): client, product, principal, term
  (installments) and frequency (daily, weekly, semi-monthly). Choosing a product fills in its usual
  term and frequency. A live panel shows interest, total to repay, installment, service fee,
  insurance and net proceeds, next to a **schedule preview** (due date, principal, interest,
  installment and balance per installment, with totals). "Submit for approval" files it.
- **Sample products**: Weekly regular 20% for 12 weekly, Daily regular 20% for 84 daily,
  Semi-monthly 18% for 6 semi-monthly. Interest is flat on the principal, pro-rated by how long the
  loan runs. The installment is rounded up to the centavo; the last one takes the rounding.
- Only released loans have a balance, take payments, appear on collector routes and in reports.
  The sample data has one loan for approval (LN-2026-0481) and one approved (LN-2026-0482).

### 6. Clients

- Client list for the branches the user can see.
- Client profile: KYC and status badges, balances, tabs for Details, IDs and documents, Loans
  (ledger with running balance), Receipts, Safekeeping and History; "New payment" and "New loan".

### 7. Reports

Every report has filters, summary cards, a printable body, and Excel (CSV), PDF and Print buttons.
Branch staff see Sindalan only; the President can pick a branch or view all. Cash reports
(Cash Receipts, Collections, Disbursements, Safekeeping) are for accounting officers and the
President; loan reports (Daily target, Loan ledger, Aging) for every office role.

| Report | What it shows |
|---|---|
| Cash Receipts Book | Posted and cancelled receipts by date and collector; cash received = Loans Receivable + Safekeeping; an accounting officer can cancel a receipt with a reason (the number stays with zero amounts) |
| Daily target of collectors | Accounts by loan status, paid-ahead amounts in green parentheses, subtotals of positive amounts due, recap |
| Collections | Target vs. collected per collector per day, variance, efficiency, bar chart |
| Disbursements | Loans released with service fee, insurance and net proceeds, including loans released from the Loans screen |
| Loan ledger | Any loan's full ledger with the running balance |
| Aging of receivables | Open balances by days since the last payment, portfolio at risk, accounts over 90 days |
| Safekeeping balances | Each client's beginning balance, deposits and ending balance |
| Print Reports | List of all of the above, plus three "coming soon" |

### 8. Collector phone (view only)

The phone no longer posts receipts. Collectors issue the official receipt in the field and the
accounting officer encodes it.

- **Today**: greeting with live clock, the collector's **daily target**: collectible today,
  accounts due, penalties included, then every account due today (overdue first, biggest amounts
  next) and the open accounts with nothing due. Each opens the client profile.
- **Clients**: searchable list of the collector's own clients.
- **Client**: balances, installments, recent ledger entries, "View full ledger".
- **More**: light/dark switch and sign out.

### 9. Utilities

Day close (placeholder), Settings (see above), plus Receipt booklets and Users and passwords
marked "coming soon".

## Business rules in the code

- **Money**: integer centavos, so totals never drift.
- **Receipts are never edited**: a mistake is fixed by cancelling, which keeps the number with zero
  amounts.
- **Collector**: the collector on a receipt always comes from the client's record.
- **Scoping**: each branch sees its own data; a collector sees only their own clients; the
  President sees every branch.
- **Breakdown order**: safekeeping and other penalty as typed, then unpaid penalties, then
  amortization; paying more than is due goes toward the loan (paid ahead), up to the balance.
- **Due today**: unpaid penalties plus the current installment.
- **Rebate**: flat interest of every unpaid installment not yet due; full payment only.
- **Ledger**: receipts count on their effective date; other penalties are charged and paid on the
  same receipt; rebates are a credit.
- **Loans**: filed by a loan officer → approved by a loan officer or the President → released by
  an accounting officer; release creates the next DV and applies the 3% service fee and 1% insurance.
- **Roles**: each screen and action checks the role's permissions (see Roles).

## Code layout

| Folder | What's in it |
|---|---|
| `src/lib/` | The rules: `cashiering.ts`, `loans.ts`, `ledger.ts`, `receipts.ts`, `dailyTarget.ts`, `money.ts`, `dates.ts` |
| `src/data/` | Sample data: users, branches, collectors, clients, loans (with status), receipts, booklets, route snapshot, report figures |
| `src/state/` | Sign-in (`auth.tsx`), roles and permissions (`permissions.ts`), settings (`settings.tsx`), session and scoping, the in-memory store (receipts, loans, disbursements), portfolio helpers, the cashiering form |
| `src/pages/` | One file per screen; `loans/`, `reports/` and `mobile/` subfolders |
| `src/components/` | Sidebar, layout, report helpers, shared badges and alerts, client search, money input; `ui/` holds the shadcn components |

## Tests

32 tests, all passing:

- **Report math**: Cash Receipts totals and balance, ledger running balance, loan summary,
  safekeeping, daily target subtotals and recap, all against the mockup figures.
- **Cashiering**: account summary split, rebate, breakdown modes, typed safekeeping taken first,
  overpayment going toward the loan, money beyond the balance left unallocated, full payment
  clearing the loan.
- **Encode Payments flow**: route, account, cash, breakdown modes, an incomplete check blocked,
  post with Ctrl+S, Cash Receipts still balances, then cancel.
- **Loans**: pro-rated interest, a schedule that adds up with the rounding in the last
  installment, loan and voucher numbering; the full flow (validation, schedule preview, the loan
  officer files and approves, an accounting officer releases with DV-2224, the voucher on
  Disbursements, the released loan on the collector's route, a pending loan kept off it).
- **Role limits**: the loan officer can't open Encode Payments or release, and doesn't see cash
  menu items; an accounting officer can't file or approve loans.
- **Sign-in and start pages**: redirect back after sign-in, accounting officer → Encode Payments,
  loan officer → Loans, President → Daily target, collector → phone, Dashboard only with the setting on, collectors
  kept out of office screens, wrong password and lockout, empty fields.
- **Client search**: opens, filters and picks a client.

## Changes in the latest round

- **Redesign after Mercury** (branch `redesign-mercury`, not yet on the client preview): new
  colours, Geist, raised centavos, a top bar with search (Ctrl+K), the role's main job and the
  account menu, divided summary strips instead of stat cards, flat tables, and right-hand detail
  panels on Loans, Clients and Cash Receipts (receipts can be cancelled from the panel). The
  Dashboard, sign-in, reports, Encode Payments and the collector phone screens all use the same
  look. Made with the taste-skill, Impeccable and Emil Kowalski design skills; Impeccable's
  independent finish review passed after two fix rounds. Product facts are in `PRODUCT.md`, the
  design system in `DESIGN.md`. All 30 screenshots are retaken in the new look.
- **Deployed for client checking**: published to GitHub Pages with automatic test-and-deploy on
  every push (see Client preview). The app now works under a sub-path (`BASE_PATH` for the build,
  router `basename`), and `404.html` lets direct links open the right screen.
- **Safekeeping typed in**: on Encode Payments, safekeeping is now a manual field (like other
  penalty) instead of being computed from what's left over. This replaces the design README's
  "safekeeping automatic, never typed in" rule. Anything above the amount due now goes toward the
  loan as an advance payment, up to the balance.
- **Total to cash / Total to check** are still there: they're greyed out only while the breakdown
  total is ₱0, and work once an amount is typed or a breakdown mode is picked.
- **Roles**: Cashier replaced by Accounting officer; Loan officer added (A. Cruz); President and
  Collector kept. Duties split as in the Roles table, with role-aware menus, buttons, Dashboard
  and "No access" pages.

## Changes in the round before

1. President sample user renamed to Tanya.
2. Journal Entries removed from the menu; renewal offset removed from Disbursements; Dashboard
   behind a setting that is off by default, with role-based start pages.
3. Phone made view only: Collect payment and the phone receipt form removed; Today is now the
   collector's daily target.
4. shadcn theme set to the design README tokens, IBM Plex Sans, dark mode kept.
5. Inputs and buttons 40 px tall.
6. Loans screen added: list, new-loan form with schedule preview, Approve, Release with a
   disbursement voucher.

## Bugs found and fixed along the way

- An amount field dropped the first digit when typed quickly.
- After sign-in, the app ignored the page you'd asked for.
- An unreported route showed as zero on the President's chart and weekly comparison.
- Opening the client search (Ctrl+K) crashed the app to a blank page.
- Every new receipt booklet was flagged "running low", and Due soon cut off its buttons.

## Open questions

1. **Approval limits**: a loan officer can approve a loan they filed themselves. Should a second
   person (another loan officer, or the President above a certain amount) have to approve?
2. **Products and rates**: the three products and their rates are samples; the 3% service fee and
   1% insurance too.
3. **Computed penalty**: only penalties already on the ledger are used; the late-penalty rate isn't
   known yet.
4. **Rebate rule**: confirm it's the flat interest on installments not yet due.
5. **Portfolio at risk limit**: the Dashboard's "5% limit" is a placeholder.
6. **Safekeeping and Disbursements menus** open reports; the legacy system may have data-entry
   screens there (withdrawals, releases outside the Loans screen).
7. **Overpayment with no safekeeping**: it currently goes toward the loan as an advance. Should it
   go to safekeeping instead, or block posting until it's assigned?
8. **Public preview**: the repo and preview are public. If the client prefers it private, it needs
   a host with a password (e.g. Netlify or Vercel with protection) or a private repo on a paid plan.

## Not built yet

- A server, database and real sign-in. Data lives in memory and resets on reload.
- Day close, Receipt booklets, Users and passwords, safekeeping withdrawals, the "coming soon"
  reports.
- Loan restructuring, renewals and write-offs.
