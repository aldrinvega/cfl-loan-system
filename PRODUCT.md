# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Accounting officers** (one or two per branch), at a desk PC all day. They post the official
  receipts the collectors bring back from their routes, cancel wrong receipts, release approved
  loans and run the cash reports. Speed and accuracy with the keyboard matter most; they encode
  dozens of receipts a day.
- **Loan officers**, at a desk PC. They file new loans for clients and approve them.
- **The President**, across all branches. Reads the daily target, collections, aging and the
  Dashboard; approves loans; does not post entries.
- **Collectors**, on a phone in the field. View-only: their route for today, who owes what, and
  each client's ledger. They issue paper receipts; the office encodes them.

## Product Purpose

Cash Flow Lending Corporation's loan system: it replaces a legacy desktop system for a Philippine
micro-lending company with several branches. It records loans from application to release, the
receipts collected against them, and the reports the company runs on (Cash Receipts Book, daily
target of collectors, collections, disbursements, loan ledger, aging, safekeeping). Success is
an accounting officer posting a collector's whole stack of receipts quickly and correctly, and
every report balancing.

## Positioning

Built around how this lender actually works: collector routes, OR booklets per collector,
safekeeping deposits, flat-rate weekly/daily/semi-monthly loans, and the legacy menu the staff
already know (Encode Payments, Loans, Safekeeping, Clients, Cash Receipts Book, Disbursements,
Utilities, Print Reports).

## Operating Context

- Office staff work a business day that opens and closes; receipts post to that business day.
- Receipts are never edited, only cancelled (the number stays with zero amounts).
- Money is in Philippine pesos (₱), stored as integer centavos.
- Each branch sees its own data; the President sees every branch.
- The app is currently a client preview: all data is fictional sample data in memory, and the
  sign-in is a demo.

## Capabilities and Constraints

- Stack: React 19, TypeScript, Vite, React Router, Tailwind CSS v4, shadcn/ui (Base UI), Vitest.
  Deployed to GitHub Pages from `main`.
- Roles and permissions in `src/state/permissions.ts`; business rules in `src/lib/`.
- Terminology to keep: Encode Payments, OR number, collector, route, safekeeping, amortization,
  penalty, rebate, DV (disbursement voucher), business day, day close.
- Undecided: approval limits, real rates and fees, late-penalty rate, PAR limit (see
  WORK-SUMMARY.md open questions).

## Brand Commitments

None binding. The owner chose to drop the earlier navy/red look and IBM Plex Sans and follow the
Mercury banking app references (shared 2026-10-24) for the redesign: light shell, quiet tables,
detail side panels.

## Evidence on Hand

No real customers, figures, logos or photographs. Every name and amount is sample data and must
stay marked as such; never present it as real.

## Product Principles

1. The accounting officer's posting flow comes first: fewest steps, full keyboard support.
2. Every number must add up across screens and reports.
3. Show each role only what it can do.
4. Familiar to staff who know the legacy menu; no relearning of terms.

## Accessibility & Inclusion

Long sessions at a desk: readable type sizes, strong contrast for amounts, visible focus for
keyboard use. Collectors read the phone outdoors.
