-- Thela — Database schema v0
-- Target: Supabase / Postgres
-- Use with auth.users as parent identity table

-- =============================================================
-- Profiles + households
-- =============================================================

create table user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  city text not null default 'Bengaluru',
  created_at timestamptz default now()
);

-- One household per user in v0 (future: many-to-many for shared households)
create table households (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(user_id) on delete cascade,
  members jsonb not null default '[]',            -- [{name, age_band, diet}]
  diet_default text not null default 'veg',       -- veg | non_veg | eggetarian
  cooking_pattern jsonb not null default '{}',    -- {home_dinners_per_week, cuisine_tilt, spice_level}
  staple_preferences jsonb not null default '{}', -- {paneer_brand, atta_brand, ...}
  notes text,                                     -- free-text household notes
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================================
-- Catalog + weekly pricing
-- =============================================================

create table items (
  id uuid primary key default gen_random_uuid(),
  name text not null,                     -- 'Tomato (Kolar, A-grade)'
  category text not null,                 -- 'produce' | 'dairy' | 'staples' | 'fruit'
  unit text not null,                     -- 'kg' | 'g' | 'pc' | 'pack'
  typical_pack_size numeric,              -- e.g., 0.5 for a 500g default
  seasonality jsonb not null default '{}',-- {in_season_months:[1,2,3], peak_months:[2]}
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Weekly price snapshot with fairness verdict
create table prices (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  week_start date not null,               -- Monday of the week
  thela_price numeric not null,           -- per items.unit
  zepto_price numeric,
  bb_price numeric,
  fairness text not null,                 -- 'green' | 'amber' | 'skip'
  fairness_reason text,                   -- short string surfaced in UI + agent context
  confidence numeric default 1.0,         -- 0..1; UI surfaces flag when <0.8
  unique (item_id, week_start)
);

-- =============================================================
-- Baskets + items
-- =============================================================

create table baskets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  week_start date not null,
  status text not null default 'draft',   -- 'draft' | 'committed' | 'delivered' | 'cancelled'
  total_amount numeric,
  benchmark_zepto numeric,                -- snapshotted at commit time
  benchmark_bb numeric,
  committed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (household_id, week_start)
);

create table basket_items (
  id uuid primary key default gen_random_uuid(),
  basket_id uuid not null references baskets(id) on delete cascade,
  item_id uuid not null references items(id),
  quantity numeric not null,              -- in items.unit
  unit_price numeric not null,            -- snapshotted at propose/commit time
  fairness text not null,                 -- snapshotted for the UI
  fairness_reason text,
  agent_note text,                        -- e.g., "added because in-laws visiting"
  status text not null default 'active',  -- 'active' | 'skipped_by_agent' | 'removed_by_user'
  created_at timestamptz default now()
);

-- =============================================================
-- Orders (post-commit)
-- =============================================================

create table orders (
  id uuid primary key default gen_random_uuid(),
  basket_id uuid not null references baskets(id),
  household_id uuid not null references households(id),
  delivery_slot_fresh timestamptz,        -- e.g., Tuesday 8 a.m.
  delivery_slot_staples timestamptz,      -- e.g., Friday 8 a.m.
  status text not null default 'placed',  -- 'placed' | 'fulfilled_partial' | 'fulfilled' | 'cancelled'
  total_amount numeric not null,
  created_at timestamptz default now()
);

-- =============================================================
-- Conversation log (for evals + iteration)
-- =============================================================

create table agent_sessions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  basket_id uuid references baskets(id),
  messages jsonb not null default '[]',   -- [{role, content, tool_calls, tool_results}]
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- =============================================================
-- Indexes
-- =============================================================

create index idx_prices_item_week on prices(item_id, week_start);
create index idx_baskets_household_week on baskets(household_id, week_start);
create index idx_basket_items_basket on basket_items(basket_id);
create index idx_orders_household on orders(household_id);
create index idx_agent_sessions_household on agent_sessions(household_id);

-- =============================================================
-- Design notes
-- =============================================================
-- 1. prices.week_start: fairness is a weekly product construct, not a
--    live ticker. Weekly snapshot keeps the agent deterministic and
--    the docs auditable.
--
-- 2. basket_items.status includes 'skipped_by_agent' so "don't buy"
--    items are persisted in the basket (not filtered out). This
--    drives the struck-through UI with reason hover.
--
-- 3. agent_sessions.messages is jsonb, not a structured message table.
--    We won't query it much in v0, but the evals/iteration story in
--    the portfolio docs benefits from having it captured.
--
-- 4. households.notes is free-text, deliberately. Structured notes
--    fields die under real-world messiness. The agent reads and
--    occasionally updates this.
--
-- 5. No RLS (Row Level Security) policies defined here. Add them in
--    v0.1 before any pilot traffic; omitted for 2-day scope clarity.
