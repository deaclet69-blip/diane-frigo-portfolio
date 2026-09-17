# DIANE FRIGO — Cold Storage Management SaaS

A full-stack inventory, sales, and finance management system built for a
real cold-storage wholesale/retail business (frozen meat & poultry) in
Central Africa, currently used in production. This repository is the
**public portfolio version** — same codebase, English UI, sample data,
danger-zone actions disabled.

**Live demo:** https://diane-frigo-demo-frontend.onrender.com
(demo@dianefrigo.app / Demo1234! — read-only sample data, regenerated
daily)

## What it does

The business previously tracked stock, sales, and expenses across several
disconnected Excel sheets, with no single source of truth for stock
levels, customer debts, or actual profitability per product. This app
replaces that with one system:

- **Sales** — multi-line invoices, partial/credit payments, "leave on
  deposit" (a common local practice where a customer's stock stays at the
  warehouse), invoice voiding that correctly reverses stock
- **Stock** — real-time levels computed from entries/adjustments/exits,
  automatic low-stock/out-of-stock status, full movement history per
  product
- **Customers** — purchase history, running debt, deposit balances,
  duplicate-customer merging that reassigns history without deleting
  anything
- **Finances** — monthly revenue/expenses/net result, a "recovery
  target" tracker (progress toward recouping a fixed/variable/one-time
  cost base), fixed vs. variable expense classification
- **Profitability** — full cost basis per product (weighted average
  purchase price + allocated fixed & variable expenses per box sold),
  with suggested floor/bulk/wholesale/retail prices
- **Reports & audit log** — sales/expense breakdowns over any period, a
  full audit trail of who did what
- **AI Assistant** — a chat interface with real-time access to the
  business's actual data (stock, sales, customers, debts, expense
  history), used for questions like "which product brought in the most
  customers this quarter" or "can I cover payroll this month"
- **Excel import** — bulk-imports historical sales/stock data from the
  business's existing spreadsheet format, with a mandatory preview step
  and duplicate detection before anything is written

## Architecture

```
frontend/   React 18 + TypeScript (strict) + MUI, Vite
backend/    NestJS + Prisma + PostgreSQL (Neon)
```

- **Auth**: JWT access/refresh tokens, role-based guards (`ADMIN` /
  `RESPONSABLE`), fine-grained permission checks on sensitive routes
- **Data integrity**: multi-step business operations (e.g. recording a
  sale: invoice + line items + stock movements + payment) run inside a
  single Prisma transaction — never partially applied
- **Validation**: global `ValidationPipe` with `whitelist` +
  `forbidNonWhitelisted`, rejecting any unexpected field
- **Security**: `helmet`, global + per-route rate limiting (stricter on
  `/auth/login`), CORS restricted to a configured origin list, no
  fallback secrets — the app refuses to start if `JWT_ACCESS_SECRET` /
  `JWT_REFRESH_SECRET` are missing rather than falling back to a
  predictable default
- **Audit log**: every create/update/delete on sensitive entities
  (products, stock movements, expenses, users, imports) is recorded

### A few implementation details worth noting

- **Stock calculation is order-independent** (`entries + adjustments −
  exits`, not a running total per row) — the original spreadsheet's
  cascading formulas broke whenever a row was inserted out of order.
- **Cost basis** intentionally separates weighted-average purchase price
  from allocated expenses, and separates *fixed* expenses (which enter
  the per-box cost) from *variable* ones (which reduce net profit but
  not the cost basis) — this distinction was a deliberate business
  decision, not an oversight.
- **The AI Assistant's context** is built fresh on every question from
  real Prisma queries (full sales history, per-product unique-customer
  counts, expense history by category) — not a static snapshot — so it
  can answer questions about any period, not just "this week."
- **The Excel import** is a two-step preview/confirm flow: nothing is
  written to the database until the person reviewing the preview
  explicitly confirms it, and the whole import runs in one transaction.

## Running it locally

```bash
cd backend
cp .env.example .env        # set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
npm install
npx prisma migrate dev
npm run seed
npm run start:dev
```

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the dev server proxies `/api` to
`http://localhost:3000`.

### Tests

```bash
cd backend
npm test
```

## What's next

- Broaden test coverage (Sales, Invoices, Finances — currently strongest
  on Stock)
- Downloadable PDF invoices
- Real-time notifications (stock alerts, overdue debts) beyond the
  current in-app list

## Related repos / branches

- `main` — the production version (French UI, real business data, full
  danger-zone actions)
- `demo-english` — this branch
