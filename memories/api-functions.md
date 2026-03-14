# API Functions — Conversation Memory
**Date:** 2026-03-14
**Project:** ScapePulse (server-loot-forge)

---

## Overview

This session covered a full redesign of the dashboard sidebar, a new Transactions system, and the complete build of the ScapePulse Java API SDK backed by Supabase Edge Functions.

---

## 1. Dashboard Sidebar Restructure

**File:** `src/components/DashboardSidebar.tsx`

Replaced the flat group layout with collapsible service sections modeled after teamgames.io.

### New structure:
- **MAIN** (flat): Overview, Servers
- **AUTO WEBSTORE** (collapsible, default open if on a child route):
  - Products → `/dashboard/products`
  - Categories → `/dashboard/categories`
  - Discounts → `/dashboard/discounts` *(Soon badge — not yet implemented)*
  - Loyalty Points → `/dashboard/loyalty` *(Soon)*
  - Transactions → `/dashboard/transactions`
  - Payment Methods → `/dashboard/payment-methods` *(Soon)*
  - Customers → `/dashboard/customers` *(Soon)*
  - Orders → `/dashboard/orders`
  - Settings → `/dashboard/settings`
- **AUTO VOTE** (collapsible):
  - Votes → `/dashboard/votes`
  - Settings *(Soon)*
- **AUTO HISCORES** (collapsible):
  - Manage Hiscores → `/dashboard/hiscores-settings`
  - Settings → `/dashboard/hiscores-settings`
- **SYSTEM** (flat): API Keys

Uses `Collapsible` / `CollapsibleContent` from shadcn/ui + `SidebarMenuSub` / `SidebarMenuSubItem` / `SidebarMenuSubButton`. "Soon" items render as non-clickable spans with a small grey badge.

---

## 2. Transactions Page

**File:** `src/pages/dashboard/Transactions.tsx`
**Route:** `/dashboard/transactions` (added to `src/App.tsx`)

Features:
- Full table of `pending_transactions` with columns: Transaction ID, Player, Items, Status, **Claimed** badge, Total, Date, Delete
- **Claimed / Unclaimed** badge — green when `claimed = true`, grey when false
- **Create Transaction** dialog — manual entry: player username, product name, quantity, price, transaction ID
- Delete button per row

---

## 3. DB Migrations

### `supabase/migrations/202603140900_add_claimed_to_pending_transactions.sql`
```sql
ALTER TABLE pending_transactions ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT false;
UPDATE pending_transactions SET claimed = true WHERE status = 'claimed';
```
The `claimed` boolean is set to `true` by the game server plugin (via the Edge Function) when a player claims their purchase in-game. Separate from `status` so the dashboard can display it as a dedicated flag.

### `supabase/migrations/202603140901_hiscores_boss_kills.sql`
```sql
ALTER TABLE hiscores ADD COLUMN IF NOT EXISTS boss_kills JSONB DEFAULT '{}';
```
Stores boss kill counts as a JSONB map e.g. `{"zulrah": 50, "vorkath": 120}`. Populated by the game server via `sp-hiscores`.

---

## 4. Data Service Updates

**File:** `src/lib/data.ts`
**File:** `src/lib/mock-data.ts`

Added `PendingTransaction` interface:
```ts
interface PendingTransaction {
  id, server_id, username, cart_items[], total, transaction_id,
  status: "pending"|"paid"|"failed"|"claimed",
  claimed: boolean,
  created_at, updated_at
}
```

Added methods to `dataService`:
- `getPendingTransactions(serverId?)` — fetches all, ordered by created_at desc
- `createPendingTransaction(tx)` — creates with `id = tx-${Date.now()}`
- `updatePendingTransactionStatus(id, status, claimed?)` — updates status + claimed flag
- `deletePendingTransaction(id)` — hard delete

---

## 5. Java API SDK (`api/`)

**Location:** `api/` (gitignored)
**Build:** `mvn clean package` → `target/scapepulse-api-1.0.0.jar`
**Java version:** 8+
**Package:** `io.scapegames.scapepulse`

### Security architecture
The JAR contains **only** a public function URL. No Supabase credentials, no anon key, no DB URL.

```
Game Server JAR
    │ POST + Authorization: Bearer <api-key>
    ▼
ScapePulse Edge Functions  ← API key validated here using service role key
    │ service role key (never leaves Supabase)
    ▼
Supabase DB
```

### ScapePulseConfig
```java
// ONLY thing the user ever configures:
ScapePulseConfig config = new ScapePulseConfig("YOUR_API_KEY");
```
Internally holds:
```java
static final String API_BASE = "https://rsgpszjcbbveavsffzrp.supabase.co/functions/v1";
```
No anon key, no DB URL. `API_BASE` is a public function endpoint — safe to decompile.

### Endpoint classes

#### `endpoints/store/Transaction`
- `setPlayerName(String)`
- `getTransactions()` → `Claim[]`
  - POSTs to `sp-transactions`
  - Returns items **and marks them claimed atomically server-side**
  - `Claim` fields: `player_name`, `product_id`, `product_name`, `product_price`, `product_amount`, `game_item_id`, `commands[]`, `transaction_id`

#### `endpoints/hiscores/Hiscores`
- `setPlayerName`, `setGameMode`, `setXpMode`, `setTotalLevel`, `setTotalXp`, `setCombatLevel`
- `setSkill(name, level, xp)` — accepts `int` or `long` xp
- `setBossKill(bossKey, kc)` — snake_case boss keys
- `syncPlayer()` → `boolean` — POSTs to `sp-hiscores` action=sync, upserts on `(server_id, username)`
- `getPlayer(username)` → `PlayerRecord`
- `getLeaderboard(limit)` / `getLeaderboard(limit, gameMode, xpMode)` → `PlayerRecord[]`

Skill name constants: `Hiscores.SKILL_NAMES` (all 23 OSRS skills)

#### `endpoints/vote/Vote`
- `setPlayerName(String)`
- `getVotes()` → `Record[]` — all votes
- `getVotesSince(sinceTimestamp)` → `Record[]` — only votes after ISO-8601 timestamp
- `getVoteCount()` → `int`
- `Record` fields: `id`, `server_id`, `username`, `vote_site`, `timestamp`

### HttpClient
Single method: `post(url, jsonBody)` → `String`
Sends `Authorization: Bearer <api-key>` on every request. No other auth.

### pom.xml
- `groupId`: `io.scapegames`
- `artifactId`: `scapepulse-api`
- `version`: `1.0.0`
- Gson `2.10.1` shaded + relocated to `io.scapegames.scapepulse.lib.gson` (avoids conflicts with servers that bundle their own Gson)
- Sources jar also produced

---

## 6. Supabase Edge Functions

**Location:** `supabase/functions/sp-*/index.ts`
**Deployed:** `supabase functions deploy <name> --no-verify-jwt`
`--no-verify-jwt` means no Supabase anon key is needed to invoke — auth is done purely via the API key in the request body validation.

All three functions follow the same pattern:
1. Extract `Authorization: Bearer <key>` header
2. Create Supabase client with `SUPABASE_SERVICE_ROLE_KEY` (env var, never in JAR)
3. Lookup `servers` table by `api_key` → get `server_id`
4. If not found → `401 Invalid API key`
5. Perform the requested operation using the service role client
6. Return JSON response

### `sp-transactions/index.ts`
- Method: `POST`
- Body: `{ playerName: string }`
- Fetches `pending_transactions` where `server_id=X, username ilike Y, status=paid, claimed=false`
- For each transaction: resolves product details, builds `claims[]` array, creates `orders` + `order_items` records
- Batch updates all matched transactions: `status=claimed, claimed=true`
- Response: `{ status: "SUCCESS"|"NO_ITEMS"|"ERROR", claims: [...] }`
- Each claim: `{ player_name, product_id, product_name, product_price, product_amount, game_item_id, commands[], transaction_id }`

### `sp-hiscores/index.ts`
- Method: `POST`
- Body: `{ action: "sync"|"getPlayer"|"leaderboard", ...fields }`
- **sync**: upserts hiscores record with `skill_levels`, `skill_xp`, `boss_kills` JSONB fields. Uses `onConflict: "server_id,username"`.
- **getPlayer**: returns single player record by username (ilike)
- **leaderboard**: returns top N players ordered by `total_xp` desc, optional `gameMode`/`xpMode` filters

### `sp-votes/index.ts`
- Method: `POST`
- Body: `{ playerName: string, sinceTimestamp?: string }`
- Queries `votes` table filtered by `server_id` + `username ilike` + optional `timestamp > sinceTimestamp`
- Response: `{ status: "SUCCESS"|"ERROR", count: number, votes: [...] }`

---

## 7. Existing Edge Functions (pre-existing, not modified)

| File | Purpose |
|------|---------|
| `store-checkout.ts` | PayPal checkout flow |
| `store-claims.ts` | Store claims (detailed response format, auto-creates orders) |
| `store-products.ts` | Product listing for storefront |
| `store-transaction.ts` | Original transaction handler |
| `store-transaction-v3.ts` | Updated transaction handler (flat response for Java) |

---

## 8. Reference: Existing HiscoresSync Pattern

The user's existing Java hiscores sync (`HiscoresSync.java`) used Apache HttpClient to POST to a custom endpoint with `Authorization: Bearer <key>`. The new `Hiscores.java` class in the SDK mirrors this pattern exactly but uses standard `HttpURLConnection` (no extra dependencies) and points to the `sp-hiscores` Edge Function.

Key mapping (standard RSPS `playerXP[]` array index → skill name):
```
xp[0]  = attack       xp[1]  = defence      xp[2]  = strength
xp[3]  = hitpoints    xp[4]  = ranged        xp[5]  = prayer
xp[6]  = magic        xp[7]  = cooking       xp[8]  = woodcutting
xp[9]  = fletching    xp[10] = fishing       xp[11] = firemaking
xp[12] = crafting     xp[13] = smithing      xp[14] = mining
xp[15] = herblore     xp[16] = agility       xp[17] = thieving
xp[18] = slayer       xp[19] = farming       xp[20] = runecraft
xp[21] = hunter       xp[22] = construction
```

---

## 9. Key File Locations

| File | Description |
|------|-------------|
| `src/components/DashboardSidebar.tsx` | Collapsible sidebar |
| `src/pages/dashboard/Transactions.tsx` | Transactions dashboard page |
| `src/lib/mock-data.ts` | `PendingTransaction` interface |
| `src/lib/data.ts` | Transaction CRUD methods |
| `src/App.tsx` | Route: `/dashboard/transactions` |
| `supabase/functions/sp-transactions/index.ts` | Edge Function — store claims |
| `supabase/functions/sp-hiscores/index.ts` | Edge Function — hiscores sync/read |
| `supabase/functions/sp-votes/index.ts` | Edge Function — vote queries |
| `supabase/migrations/202603140900_*.sql` | Add `claimed` column to pending_transactions |
| `supabase/migrations/202603140901_*.sql` | Add `boss_kills` column to hiscores |
| `api/pom.xml` | Maven build — produces fat jar |
| `api/src/.../ScapePulseConfig.java` | Single-arg config: `new ScapePulseConfig("key")` |
| `api/src/.../endpoints/store/Transaction.java` | Store transactions endpoint |
| `api/src/.../endpoints/hiscores/Hiscores.java` | Hiscores sync endpoint |
| `api/src/.../endpoints/vote/Vote.java` | Votes endpoint |
| `api/src/.../example/ExampleHiscoresSync.java` | RSPS integration reference |
| `api/src/.../example/ExampleTransactionClaim.java` | Claim command reference |

---

## 10. Supabase Project

- **Project ID:** `rsgpszjcbbveavsffzrp`
- **URL:** `https://rsgpszjcbbveavsffzrp.supabase.co`
- **Anon key:** stored in `.env` as `VITE_SUPABASE_ANON_KEY` — used by the web frontend only
- **Service role key:** only exists as a Supabase env var (`SUPABASE_SERVICE_ROLE_KEY`) inside Edge Functions — never in any client code or JAR
