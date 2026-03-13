# Session Memories - Loot Forge Setup

## Date: 2026-03-12

## Completed Actions

### 1. Vercel Setup ✅
- Linked project to Vercel: `dmndmedia1s-projects/server-loot-forge`
- Deployed to: **https://server-loot-forge-b40a53u0t-dmndmedia1s-projects.vercel.app**
- Added environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### 2. Supabase Setup
- Created Supabase client at `src/lib/supabase.ts`
- Created database schema at `supabase/schema.sql`
- **Need to run the SQL in Supabase dashboard**

### 3. Database Schema (needs to be run in Supabase SQL Editor)
- Tables: servers, categories, products, orders, order_items, votes
- Sample data included
- RLS enabled with public read policies

## Next Steps
- [ ] Run supabase/schema.sql in Supabase SQL Editor
- [ ] Connect frontend to Supabase (replace mock data)
- [ ] Implement authentication
- [ ] Implement checkout/payment
