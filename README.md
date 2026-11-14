# Bilal Jewellers — Gold Jewellery POS

A premium, offline-first Point-of-Sale system for gold jewellery retail. Built for
speed, calculation accuracy and reliability.

## Stack

- **React 19 + TypeScript + Vite** — UI
- **Tailwind CSS v4** — styling with gold / ink theme & dark mode
- **Supabase (Postgres)** — persistent invoice storage (drop-in replacement for
  SQLite; see "Running as a Windows desktop app" below for the Electron + SQLite build
  path)
- **Decimal-safe arithmetic** — all monetary math is done in integer micro-units
  to avoid IEEE float drift (`src/lib/money.ts`)

## Features

### POS Billing
- Auto-generated invoice numbers (`BJ-YYYYMMDD-HHMMSS-XXX`)
- Multi-item invoices with description, weight (g), wastage %, making charges
- Live calculation of wastage weight, total weight, gold amount & line totals
- Gold rate configurable per **gram** or per **tola** (`1 tola = 11.664 g`)
- Customer name & phone (optional)
- Non-negative input validation on every numeric field
- All calculations update instantly on any change

### Gold Formula
```
WastageWeight  = Weight × Wastage% / 100
TotalWeight    = Weight + WastageWeight
GoldAmount     = TotalWeight × RatePerGram
FinalAmount    = GoldAmount + MakingCharges
InvoiceTotal   = Σ FinalAmount
```
All math is performed in integer micro-units (×1,000,000) and rounded to 2dp for
money / 3dp for weight only at display boundaries.

### Invoice Generation
- Professional preview on screen
- A4 printable invoice (formal layout)
- 80mm thermal receipt layout
- Browser print pipeline — any configured printer works
- JSON-based per-invoice backup from the viewer

### Dashboard
- Today's sales total and count
- This month's total
- Recent invoices list

### History
- Full-text search across invoice number, customer name, phone
- Date range filter (from/to)
- Open any invoice to view / reprint

### Settings
- Shop name, tagline, address, phone, currency
- Rate unit (gram/tola), default rate, default wastage %
- Invoice footer text
- Default printer mode (A4 / 80mm)
- Full JSON backup & restore of every invoice + settings

### Reliability
- All totals validated before save; empty items or zero weights rejected
- Atomic insert via Supabase (acts as a transaction)
- Settings mirrored in `localStorage` so the UI works even if the API is down
- Last 20 saved invoices cached in `localStorage` for instant reprint
- Light & dark themes, no cloud lock-in beyond the database env vars

## Database schema

See `/api/*.js` for the client code. Tables:

**`invoices`**
| column           | type         | notes                             |
|------------------|--------------|-----------------------------------|
| id               | serial PK    |                                   |
| invoice_number   | text UNIQUE  | e.g. `BJ-20261110-120301-273`     |
| customer_name    | text         | nullable                          |
| customer_phone   | text         | nullable                          |
| items            | jsonb        | array of line items w/ calcs      |
| subtotal         | numeric      |                                   |
| gold_rate        | numeric      | in the chosen unit                |
| rate_unit        | text         | `'gram' | 'tola'`                 |
| wastage_percent  | numeric      |                                   |
| created_at       | timestamptz  | default now()                     |

**`settings`** — singleton row (`id = 1`) with a `data jsonb` payload.

## Scripts

```bash
npm install
npm run dev       # local dev
npm run build     # production build
```

## Running as a Windows desktop app (Electron + SQLite)

The UI, calculation engine, print layouts and all business logic live inside
`src/`. To ship this as an Electron Windows application with a local SQLite
database:

1. `npm i -D electron electron-builder` and `npm i better-sqlite3`
2. Create `electron/main.ts`, open a `BrowserWindow` loading the Vite-built
   `dist/index.html`.
3. Replace the five `/api/*.js` files with IPC handlers that execute the same
   SQL against `better-sqlite3` — the request/response shapes in
   `src/lib/invoices.ts` are intentionally minimal so this swap is mechanical.
4. Package with `electron-builder --win --x64` for a signed `.exe` installer.

Because the frontend only talks to `fetch('/api/...')` at four endpoints
(`invoices`, `invoice`, `stats`, `settings`, `restore`), swapping storage
backends does not touch the UI.
