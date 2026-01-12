# Architectural Patterns

## Data Access Layer

### CRUD Hook Pattern
All database entities follow a consistent hook structure in `src/lib/hooks/`:

```
use{Entity}()           - List all records
use{Entity}(id)         - Get single record by ID (with enabled: !!id)
useCreate{Entity}()     - Insert mutation with queryClient.invalidateQueries
useUpdate{Entity}()     - Update mutation with {id, data} signature
useDelete{Entity}()     - Delete mutation by ID
```

**Reference implementations:**
- `src/lib/hooks/use-drinks.ts:7-104` - Standard CRUD pattern
- `src/lib/hooks/use-suppliers.ts:7-104` - Identical structure
- `src/lib/hooks/use-sales.ts:75-100` - Uses `supabase.rpc()` for stored procedures

### Query Key Conventions
- List queries: `["entity_name"]` (e.g., `["drinks"]`, `["suppliers"]`)
- Single item: `["entity_name", id]`
- Nested/filtered: `["entity_name", parentId, "relation"]`
- See `src/lib/hooks/use-sales.ts:51-52` for nested example

### Supabase Client Usage
- Browser client: `src/lib/supabase/client.ts` - Creates new client per call
- Server client: `src/lib/supabase/server.ts` - Cookie-based for SSR (currently unused)
- All hooks call `createClient()` inside the queryFn, not at module level

## State Management

### React Query Configuration
Configured in `src/components/providers.tsx:10-17`:
- `staleTime: 60 * 1000` (1 minute)
- `refetchOnWindowFocus: false`

### Mutation Invalidation Pattern
After mutations, invalidate related query keys:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["entity"] });
}
```
For cross-entity effects, invalidate multiple keys - see `src/lib/hooks/use-sales.ts:95-98`

## UI Patterns

### Page Structure
All CRUD pages follow this structure (`src/app/drinks/page.tsx`):
1. Local state for dialog control: `useState` for `isCreateOpen`, `editingEntity`, `deleteConfirm`
2. Fetch data with list hook
3. `<PageHeader>` with title, description, and action button
4. `<Table>` with loading/empty/data states
5. Create dialog (triggered from header)
6. Edit dialog (controlled by `editingEntity` state)
7. Delete confirmation dialog

### Form Handling
- Native `<form>` with `FormData` extraction (not react-hook-form for simple forms)
- `mutateAsync` for submission with try/catch
- `toast.success`/`toast.error` from Sonner for feedback
- See `src/app/drinks/page.tsx:51-69` for pattern

### Component Library
Uses shadcn/ui components in `src/components/ui/`:
- Built on Radix UI primitives
- Styled with Tailwind + `class-variance-authority`
- Import from `@/components/ui/{component}`

## Database Patterns

### Business Logic Location
Complex operations are PostgreSQL stored procedures, not frontend code:
- `record_sale()` in `supabase/schema.sql:163-271` handles:
  - Inventory deduction (FIFO from suppliers)
  - Price snapshotting
  - Profit calculation
  - Transaction integrity

### Type Generation
- Types defined in `src/types/database.ts` (manually maintained to match schema)
- Helper types: `Tables<T>`, `InsertTables<T>`, `UpdateTables<T>`
- Entity aliases: `export type Drink = Tables<"drinks">`

### Relational Queries
Use Supabase's select syntax for joins:
```typescript
.select(`*, relation:table_name(field1, field2)`)
```
See `src/lib/hooks/use-sales.ts:37-40` for example

## Error Handling

### Query Errors
- Check `error` from hook return
- Display error state in component - see `src/app/drinks/page.tsx:108-114`

### Mutation Errors
- Wrap `mutateAsync` in try/catch
- Show `toast.error` with user-friendly message
- See `src/app/drinks/page.tsx:66-68`

## Layout

### App Shell
- Fixed sidebar: `src/components/sidebar.tsx` (64px width)
- Main content: `pl-64` offset in `src/app/layout.tsx:35`
- Provider wrapper: `<Providers>` includes QueryClient and Toaster
