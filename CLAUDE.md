# Zvending

Vending machine management system for tracking inventory, sales, and profitability.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui (Radix primitives) |
| Database | Supabase (PostgreSQL) |
| Data Fetching | TanStack React Query |
| Charts | Recharts |
| Forms | Native FormData + Zod (available) |

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    layout.tsx            # Root layout with Providers + Sidebar
    page.tsx              # Dashboard
    drinks/               # Drink management
    machines/             # Vending machine management
    suppliers/            # Supplier management
    inventory/            # Stock tracking
    sales/                # Sales recording
    costs/                # Operational costs
  components/
    ui/                   # shadcn/ui components (Button, Dialog, Table, etc.)
    providers.tsx         # QueryClientProvider + Toaster
    sidebar.tsx           # Navigation sidebar
    page-header.tsx       # Reusable page header
  lib/
    hooks/                # Data fetching hooks (React Query + Supabase)
    supabase/             # Supabase client setup
    utils.ts              # cn() utility for classnames
  types/
    database.ts           # Database types (manually maintained)
supabase/
  schema.sql              # Database schema + stored procedures
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/types/database.ts` | TypeScript types for all tables |
| `supabase/schema.sql` | Full database schema with `record_sale()` function |
| `src/components/providers.tsx` | React Query config (staleTime: 60s) |

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

## Database Schema

**Core tables:** `suppliers`, `drinks`, `vending_machines`
**Junction tables:** `drink_suppliers` (inventory), `machine_drink_prices`
**Transaction tables:** `sales`, `sale_line_items`, `operational_costs`

**Important:** The `record_sale()` stored procedure (`supabase/schema.sql:163`) handles:
- FIFO inventory deduction from suppliers
- Price snapshotting at time of sale
- Profit calculations

## Adding New Features

### New Entity (CRUD)
1. Add table to `supabase/schema.sql`
2. Add types to `src/types/database.ts`
3. Create hook file in `src/lib/hooks/use-{entity}.ts` following existing pattern
4. Create page in `src/app/{entity}/page.tsx`
5. Add navigation item in `src/components/sidebar.tsx:16-24`

### New UI Component
Components are from shadcn/ui. Add via:
```bash
npx shadcn@latest add <component-name>
```

## Additional Documentation

When working on specific areas, consult:

| Topic | File |
|-------|------|
| Data fetching, hooks, UI patterns | `.claude/docs/architectural_patterns.md` |
