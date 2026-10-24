# Cash Flow Lending Corporation: loan system (shadcn/ui version)

The loan system built entirely from shadcn/ui components (Sidebar, Card, Table, Tabs, Field,
InputGroup, Badge, Alert, Item, Avatar, Progress, Kbd, Empty, Breadcrumb, Command, Dialog, Select,
Switch, Chart, Sonner), redesigned after the Mercury banking app: a light shell, quiet tables,
amounts with small raised centavos, and a detail panel that opens when you click a row. The font
is Geist; dark mode is kept (switch it from the account menu at the top right). The design system
is written up in `DESIGN.md`; the product facts it serves are in `PRODUCT.md`.
This is the version being developed; `../app` is no longer updated.
All data is fictional sample data held in memory; a reload resets it.

**Client preview:** https://aldrinvega.github.io/cfl-loan-system/ (sign in with a sample account below).
Every push to `main` runs the tests, builds, and republishes it through GitHub Actions
(`.github/workflows/deploy.yml`); a failing test stops the deploy.

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # 32 tests
npm run build
```

## Signing in

Sample accounts (all use the password `cashflow123`):

| Username | Who | Lands on |
|---|---|---|
| `msantos` | M. Santos (Mila), Accounting officer, Sindalan Branch | Encode Payments |
| `acruz` | A. Cruz (Andrea), Loan officer, Sindalan Branch | Loans |
| `tnaguit` | T. Naguit (Tanya), President, all branches | Daily target of collectors |
| `rlacson` | R. Lacson (Ramon), Collector 03 | Phone screens, view only (`/m/today`) |

## Roles

There is no cashier role. Duties are split so no one does the other's job:

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

The menu, report tabs and buttons only show what the role can do; opening another role's screen
shows a "No access" page. The table lives in `src/state/permissions.ts`.

The Dashboard is hidden by default. Turn it on in **Utilities → Settings → Show the Dashboard**;
office staff then land on it after signing in. The setting is per workstation (browser storage).

The sign-in is a sample only: accounts and passwords live in `src/data/sample.ts`, five wrong
passwords lock the form for 30 seconds, and "Keep me signed in" uses localStorage. Office staff
can't open the phone screens and collectors can't open the office screens. A real system must check
passwords on a server.

## Main screens

| Screen | Route |
|---|---|
| Encode Payments | `/payments/new` (`?client=CL-00418` to preselect) |
| Loans: list, approve, release | `/loans` |
| New loan with schedule preview | `/loans/new` (`?client=CL-00418` to preselect) |
| Client profile | `/clients/CL-00418` |
| Cash Receipts Book | `/reports/cash-receipts` |
| Daily target of collectors | `/reports/daily-target` |
| Print Reports (all reports) | `/reports/more` |
| Settings | `/settings` |
| Phone: Today (collector's daily target), Clients, client profile | `/m/today`, `/m/clients` |

## Cashiering rules (from `new updates/README.md`)

Only accounting officers encode payments; the phone is view only. They pick the collector's route
and the account, types the OR number from that collector's booklet (F5 to change it), and enters only
cash and checks, plus two amounts typed by hand from the collector's receipt: **safekeeping** and
**other penalty**. The system computes the rest of the breakdown:

- **From the amount received** (default): safekeeping and other penalty come off first, as typed,
  then unpaid penalties, then amortization. Anything above the amount due goes toward the loan
  (paid ahead), up to the loan balance; money beyond the balance stays unallocated and won't post.
- **Total due today**: unpaid penalties plus the current installment, plus the safekeeping and
  other penalty typed in.
- **Full payment with rebate**: the whole balance less a rebate of the flat interest on unpaid
  installments that aren't due yet, plus what was typed in. Rebate only applies here.
- **Total to cash / Total to check** move the breakdown total into the cash line or one check.

Posting needs the breakdown total to equal cash + checks, and every check needs no., bank, branch
and date. Loans Receivable = amortization + penalties, so Cash Receipts still balances.

## Loan rules

A loan officer files a new loan **for approval**; a loan officer or the President **approves** it; the
an accounting officer **releases** it. Release creates the
next disbursement voucher (DV) dated the business day, deducts a 3% service fee and 1% insurance,
and puts the loan on the client's collector route. Only released loans take payments or appear in
reports. Interest is flat: the product's rate covers its standard term (Weekly regular: 20% for 12
weeks) and is pro-rated by how long the loan actually runs.

## Where things live

- `src/lib/`: the rules. `cashiering.ts` (breakdown modes, checks), `loans.ts` (products,
  interest, schedule, numbering), `ledger.ts` (running balance, amortization/penalty split,
  rebate), `receipts.ts`, `dailyTarget.ts`. Amounts are integer centavos.
- `src/data/`: sample data.
- `src/state/`: sign-in, settings, roles and permissions, session scoping, the in-memory store (receipts, loans,
  disbursements), portfolio helpers and the cashiering form.
- `src/index.css`: the design tokens as shadcn CSS variables, light and dark.
