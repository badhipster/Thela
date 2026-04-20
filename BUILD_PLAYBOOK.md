# Thela — Build Playbook for Antigravity

**Target:** ship a working MVP (one deep AI flow + two basic flows) in 2 days.
**IDE:** Google Antigravity (agent-driven)
**Stack:** Next.js 14 (App Router) · Supabase (Postgres + Auth) · Anthropic Claude API · Tailwind CSS · shadcn/ui
**Rule of engagement:** Antigravity writes the code; you review every diff before accepting. Never accept without reading.

---

## How to use this playbook

1. Create a new project in Antigravity and open the workspace folder that contains `SPEC_BASKET_REVIEW.md`, `AGENT_PROMPT.md`, `SCHEMA.sql`, `TOOL_CONTRACTS.md`, `SAMPLE_TRANSCRIPT.md`, and this file.
2. Work through tasks in order. Each task is a paste-ready prompt block labeled `→ PROMPT`.
3. Before each task, skim the **Context** and **Review checklist** so you know what "done" looks like before you start.
4. If Antigravity goes off the rails on a task, stop and tell it what's wrong — don't let bad code snowball.
5. Commit after each task completes cleanly. Keep commits small; it makes rollback free.

---

## Pre-flight: accounts and keys

Before Task 1, have these ready. Store keys in a notes app; you'll paste into `.env.local` later.

- [ ] **GitHub account** and a new repo called `thela` (private is fine)
- [ ] **Supabase account** — create a new project (free tier); note down:
  - Project URL
  - `anon` key
  - `service_role` key
- [ ] **Anthropic API key** from console.anthropic.com (add $5 credit; new accounts get some free credit)
- [ ] **Node.js 20+** installed locally (check with `node -v`)
- [ ] **pnpm** installed (`npm install -g pnpm`) — faster than npm, same commands
- [ ] **Vercel account** (free) — for deployment at the end. Optional until Task 12.

Time: ~30 min if you're starting from zero.

---

# Day 1

## Task 1 — Scaffold the project

**Context:** Create a fresh Next.js 14 App Router project with Tailwind, TypeScript, and shadcn/ui. This is boilerplate — let Antigravity do it.

**→ PROMPT (paste into Antigravity):**

```
Scaffold a new Next.js 14 project in this folder with the following:
- TypeScript
- App Router (not Pages Router)
- Tailwind CSS with default config
- ESLint enabled
- `src/` directory: yes
- Import alias: `@/*`
- Install and initialize shadcn/ui with the default "new-york" style, slate base color, CSS variables enabled.
- Install these dependencies: @supabase/supabase-js, @supabase/ssr, @anthropic-ai/sdk, zod, date-fns, lucide-react, clsx, tailwind-merge
- Install dev dependency: @types/node
- Create a `.env.local.example` file listing:
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    ANTHROPIC_API_KEY=
- Add a minimal README.md with stack + "how to run" instructions.
Do NOT start writing product code yet. Scaffold only. Show me the file tree when done.
```

**Review checklist:**
- [ ] `next.config.js` exists; `tsconfig.json` has the `@/*` alias
- [ ] `tailwind.config.ts` + `src/app/globals.css` both exist
- [ ] `components.json` exists (shadcn config)
- [ ] `.env.local.example` exists with all 4 variables
- [ ] `package.json` includes all listed deps
- [ ] `pnpm dev` starts the dev server without errors

**Then:** create `.env.local` from the example, paste your real Supabase + Anthropic keys.

**Commit:** `chore: scaffold Next.js + Supabase + Anthropic`

---

## Task 2 — Create the Supabase schema

**Context:** You'll run `SCHEMA.sql` directly in the Supabase SQL editor. Antigravity doesn't need to do this — it's a one-time setup.

**Steps:**
1. Open your Supabase project → SQL Editor → New query
2. Paste the full contents of `SCHEMA.sql`
3. Run it
4. Go to Table Editor → verify all 9 tables exist: `user_profiles`, `households`, `items`, `prices`, `baskets`, `basket_items`, `orders`, `agent_sessions`, plus the auth schema
5. In Authentication → Providers: enable **Email** with magic links, disable confirm-email for dev speed

**Review checklist:**
- [ ] All tables visible in Supabase Table Editor
- [ ] `auth.users` has a row after you sign yourself up (next task)
- [ ] No SQL errors in the console

---

## Task 3 — Wire Supabase Auth (magic link)

**Context:** Add Supabase client setup, middleware for session handling, and a login page. shadcn has a good `Button` and `Input` we'll use.

**→ PROMPT:**

```
Set up Supabase auth in this Next.js project. Follow the official @supabase/ssr pattern for App Router. Specifically:

1. Create `src/lib/supabase/client.ts` — browser client using createBrowserClient
2. Create `src/lib/supabase/server.ts` — server client using createServerClient with cookies()
3. Create `src/lib/supabase/middleware.ts` — session refresh helper
4. Create `src/middleware.ts` at the project root — uses the helper; matcher excludes static files and Next internals
5. Create `src/app/login/page.tsx` — a centered card with:
   - Thela logo/wordmark (plain text, big)
   - Tagline: "Your weekly grocery, planned fairly."
   - Email input
   - "Send magic link" button
   - On submit, calls supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/callback` }})
   - Shows "Check your email" state after sending
6. Create `src/app/auth/callback/route.ts` — exchanges the code for a session, redirects to `/`
7. Update `src/app/page.tsx` to:
   - If no session → redirect to /login
   - If session but no household → redirect to /onboarding
   - If session + household → redirect to /basket

Use shadcn components where applicable. Add shadcn button, input, card, label via the `pnpm dlx shadcn@latest add ...` commands as needed.

Do NOT style beyond what's needed. Keep it clean and text-first.
```

**Review checklist:**
- [ ] You can go to `/login`, enter your email, receive a magic link, click it, land back on the app authenticated
- [ ] `/` redirects correctly based on session + household state
- [ ] No hydration warnings in the browser console
- [ ] The "no household yet" branch doesn't crash — it can redirect to a 404 `/onboarding` for now

**Commit:** `feat: supabase auth with magic-link login`

---

## Task 4 — Seed the catalog

**Context:** Before the onboarding flow needs data, populate `items` and `prices` with ~40 realistic SKUs + one week of fairness data. This is a one-time script, not product code.

**→ PROMPT:**

```
Create `scripts/seed.ts` — a standalone script that seeds the Supabase database using the SUPABASE_SERVICE_ROLE_KEY (bypasses RLS). It should:

1. Use @supabase/supabase-js with the service role key from process.env.
2. Seed 40 items across categories: produce (20), dairy (8), staples (8), fruit (4). For each item include a realistic name (e.g., "Tomato (Kolar, A-grade)"), category, unit, typical_pack_size, and seasonality JSON (in_season_months, peak_months).
3. Seed the current week's prices for all 40 items. week_start = Monday of the current week. For each item:
   - thela_price: realistic Indian city wholesale-ish price
   - zepto_price: 30-80% higher than thela
   - bb_price: 10-40% higher than thela
   - fairness: 'green' for 30, 'amber' for 7, 'skip' for 3
   - fairness_reason: plausible short string matching the verdict (e.g., "Kolar harvest strong" for green; "Price up 78% WoW" for skip)
   - confidence: 0.9 or 0.95
4. Add a npm script: "seed": "tsx scripts/seed.ts"
5. Install tsx as a dev dependency.

After you generate the file, show me the list of 40 items so I can sanity-check realism. Don't run the script yet — I'll run `pnpm seed` myself after reviewing.
```

**Review checklist:**
- [ ] 40 items span produce, dairy, staples, fruit
- [ ] Prices feel realistic for Bengaluru in the current month
- [ ] At least 3 items are in the `skip` fairness bucket with believable reasons
- [ ] Script uses `upsert` or idempotent inserts so re-running doesn't error

**Run it:** `pnpm seed`, then verify in Supabase Table Editor that `items` and `prices` are populated.

**Commit:** `chore: seed catalog and weekly prices`

---

## Task 5 — Build the onboarding flow (Flow 2)

**Context:** Flow 2 from the spec — collect household profile, diet, cooking pattern, staple preferences. 3–4 short screens, no fancy animations.

**→ PROMPT:**

```
Read SPEC_BASKET_REVIEW.md (Flow 2 is the onboarding; it's briefly mentioned but details are in WORKING_FLOW.md section 5).

Build an onboarding flow at `/onboarding` that:

Screen 1 — Household basics:
- "Who's in your household?" — repeatable row of (name, age band dropdown [child/adult/senior], diet dropdown [veg/eggetarian/non_veg])
- "Your city" — dropdown with Bengaluru preselected (Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Pune)
- Next button

Screen 2 — Cooking pattern:
- "How many dinners at home in a typical week?" — number stepper 0-7
- "Cuisine tilt" — radio: North Indian / South Indian / Mixed / Other
- "Spice level" — radio: Mild / Medium / High
- Back + Next

Screen 3 — Staple preferences:
- "Paneer brand preference" — text input (placeholder: "e.g., Milky Mist, Amul, no preference")
- "Atta brand" — text input
- "Dahi default size (g)" — number input, default 400
- "Any notes we should know?" — textarea (placeholder: "In-laws visit Thursdays, kid allergic to peanuts, etc.")
- Back + Finish

On Finish:
- Insert into `user_profiles` (name = first member name, phone null, city)
- Insert into `households` with user_id, members, diet_default (majority of members), cooking_pattern, staple_preferences, notes
- Redirect to /basket

Use shadcn form components (Form, Input, Select, RadioGroup, Textarea, Button). Keep screens minimal, centered, one card per screen. Show a step indicator "1 of 3" etc. at top.

Handle the case where a household already exists — redirect to /basket immediately.
```

**Review checklist:**
- [ ] All three screens render and validate
- [ ] Submitting creates rows in both `user_profiles` and `households`
- [ ] Refreshing after completion redirects to `/basket`, doesn't re-show onboarding
- [ ] Typing Hinglish in the notes textarea works fine (basic Unicode; nothing special needed)

**Commit:** `feat: onboarding flow for household profile`

---

## Task 6 — Scaffold the basket review page (no AI yet)

**Context:** Build the static UI for Flow 1: split view with chat on left, basket card on right. No LLM calls yet — just layout + a fake basket from the DB so you can style the card.

**→ PROMPT:**

```
Build `/basket` as a split-view page:

Layout (desktop):
- Left 60%: chat area — empty for now, showing a placeholder "Your basket is ready. Review and commit."
- Right 40%: basket card — sticky, scrollable internally

Basket card contents:
- Header: "This week's basket"
- Subhead: "Total ₹X · ₹Y less than Zepto"
- Ordered list of items grouped by category (Produce, Dairy, Staples, Fruit). Each item row:
    - Fairness dot (green/amber/red) on the left
    - Item name + quantity + unit
    - Price
    - If fairness === 'skip', render the row with strikethrough and muted color
    - On hover, show fairness_reason as a tooltip
- Footer: big "Say 'commit' to place order" hint, plus delivery slots ("Fresh: Tue 8 a.m. · Staples: Fri 8 a.m.")

Data:
- For now, create a stub basket in Supabase: on page load, if no basket exists for this household + current week, create a draft basket with 6-8 hand-picked items from the catalog (variety of fairness verdicts). This is temporary scaffolding — the AI will replace it in Task 7.
- Read basket + basket_items + joined items + fairness from the DB via a server component.

Mobile layout: single column, basket card on top, chat below.

Use shadcn Card, Badge, Tooltip components. Keep visual hierarchy clean; no gradients.
```

**Review checklist:**
- [ ] Page renders with a realistic-looking basket
- [ ] Fairness dots are the right color
- [ ] Skipped items show strikethrough + muted
- [ ] Tooltip shows on hover
- [ ] Totals match the sum of basket_items (non-skipped)
- [ ] Still works if the DB has zero baskets for this week (creates the stub)

**Commit:** `feat: basket review page scaffold with live data`

---

## Task 7 — Order history page (Flow 3, basic)

**Context:** Flow 3 is the simplest. List of past baskets with date, total, and "saved vs. Zepto" number. Click into one → show the line items and the agent's summary note.

**→ PROMPT:**

```
Build `/orders` as a simple list:

List view:
- Page title: "Your orders"
- Empty state: "No orders yet — commit your first basket to see it here" with a link to /basket
- Otherwise: list of committed baskets (status = 'committed' or 'delivered'), most recent first
- Each row: week label ("Week of Apr 14"), item count, total, "₹X saved vs. Zepto" badge

Detail view at `/orders/[id]`:
- Same layout as the basket card (read-only): grouped line items with fairness dots
- Top banner: "Committed [date] · Delivered [date or 'upcoming']"
- At the bottom, a "You saved" section: total saved vs. Zepto benchmark, total saved vs. BB benchmark, list of items skipped with reasons ("We saved you from buying: Capsicum (+78% WoW)...")

Keep it read-only — no edits. Server components throughout.

Add a nav bar at the top of the app (persistent across /basket and /orders) with: Thela wordmark left, [Basket] [Orders] links right, user email + sign out far right.
```

**Review checklist:**
- [ ] Empty state shows correctly before any commits
- [ ] Nav bar renders on both pages
- [ ] Detail view shows the saved-items summary — this is a key trust moment in the product
- [ ] Sign out actually signs out

**Commit:** `feat: order history list and detail views`

---

## End of Day 1 — where you should be

By end of Day 1 you have: auth working, database seeded, onboarding flow, basket page with a stub basket, order history page. No AI yet. If you're here on time, good. If not, cut onboarding to 1 screen and move on.

**Save the working state:** push to GitHub. Note which tasks bled into Day 2 so the docs can be honest about scope cuts.

---

# Day 2

## Task 8 — Build the AI planning endpoint (THE deep flow)

**Context:** This is the core of the portfolio piece. Everything else exists to frame this moment. Do not rush.

Read `AGENT_PROMPT.md`, `TOOL_CONTRACTS.md`, `SAMPLE_TRANSCRIPT.md` in full before starting.

**→ PROMPT:**

```
Read AGENT_PROMPT.md, TOOL_CONTRACTS.md, SAMPLE_TRANSCRIPT.md in full before writing any code. These define the exact agent behavior.

Build the agent endpoint:

1. Create `src/lib/agent/tools.ts`:
   - Implement all 6 tools from TOOL_CONTRACTS.md as async functions that take the authenticated household_id and return the documented shapes.
   - `get_household_profile` → read from households table
   - `get_consumption_history(weeks)` → read last N weeks of baskets + basket_items. Compute detected_patterns server-side:
       * leftover_inferred: if quantity trended down >20% across 2+ weeks, flag
       * skip_streak: items the user has consistently skipped
   - `get_current_prices_and_fairness(sku_names)` → read current-week prices, filter by names
   - `get_seasonality_signals(week_start)` → derive from items.seasonality + prices trends (for v0, return hardcoded in_season / peaking lists based on current month; mark the TODO)
   - `propose_basket(basket)` → upsert into baskets + basket_items, set status='draft'
   - `commit_basket(basket_id)` → set status='committed', create an order row, snapshot benchmark totals

2. Create `src/lib/agent/system-prompt.ts`:
   - Export the full system prompt from AGENT_PROMPT.md as a string constant.

3. Create `src/app/api/agent/route.ts` — POST endpoint:
   - Accept { household_id, messages } body
   - Use @anthropic-ai/sdk with claude-sonnet-4-5 (or latest sonnet)
   - Pass the 6 tools in the Anthropic tool-use format (see Anthropic docs for tool_use schema)
   - Loop: call model → if response has tool_use, execute the tool, append tool_result, call model again → until stop_reason is 'end_turn'
   - Stream results back using Server-Sent Events so the UI can render tokens live
   - On every iteration, append messages to agent_sessions.messages jsonb column for that household's current draft basket

4. Create `src/lib/agent/client.ts`:
   - Browser helper that opens an SSE connection to /api/agent, accumulates messages, and exposes a React-friendly state (messages, isLoading, propose_basket events).

Follow Anthropic's current tool-use format exactly. Use `input_schema` per tool. Handle tool errors by surfacing them to the model so it can tell the user (not by crashing the endpoint).
```

**Review checklist:**
- [ ] `/api/agent` returns a 200 with a streamed response when you POST with a household_id
- [ ] Tool calls actually fire — check the Network tab and server logs
- [ ] `propose_basket` writes to the DB (verify in Supabase)
- [ ] `commit_basket` won't fire unless the model produces it after an explicit commit verb
- [ ] The `agent_sessions.messages` column captures the whole conversation

**This is the task most likely to take twice as long as expected.** If something is wrong, don't pile on fixes — read the logs, understand what the model is doing, then give Antigravity a targeted correction prompt. Antigravity + LLM tool-use is fiddly; patience here saves hours.

**Commit:** `feat: planning agent endpoint with tool use and streaming`

---

## Task 9 — Wire the chat UI into the basket page

**Context:** Replace the stub basket logic in `/basket` with a real chat UI connected to the agent endpoint.

**→ PROMPT:**

```
Update `/basket` to use the real agent. Specifically:

1. On page load (client component inside the page):
   - If the draft basket for this week is empty → open an agent session automatically ("Hi Priya, your basket is ready...")
   - If a draft already exists → show the basket + past messages from agent_sessions

2. Left panel (chat):
   - Render messages as chat bubbles (agent left, user right)
   - When agent is "thinking" (waiting on tool calls), show a subtle typing indicator
   - Input field at bottom with a send button. Enter to send. Shift+Enter for newline.
   - Every time the agent calls propose_basket, the basket card on the right re-reads from the DB and animates the change (subtle — fade-in for new items, strikethrough animation for skips)

3. Commit flow:
   - When the user types a commit verb, the agent calls commit_basket
   - On successful commit, show a success state: basket card becomes read-only with a green banner "Order placed — fresh Tue 8 a.m., staples Fri 8 a.m."
   - Link to /orders for history

Use Server-Sent Events (not polling). Use shadcn's Avatar for the bubbles. Keep the styling minimal and professional — no emojis, no cartoonish bubbles.
```

**Review checklist:**
- [ ] Opening `/basket` triggers the agent opener automatically
- [ ] Messages stream in token by token, not all at once
- [ ] Editing the basket conversationally works end-to-end per SAMPLE_TRANSCRIPT.md
- [ ] Saying "commit" actually places the order
- [ ] Saying "looks good" does NOT commit (per the commit-gate rule)
- [ ] A full session matches the vibe of SAMPLE_TRANSCRIPT.md within reason

**Commit:** `feat: live chat UI wired to planning agent`

---

## Task 10 — Polish + the "saved from" moment

**Context:** The demo hinges on one magical moment — the agent skipping an item with a visible reason. Make sure that moment reads well.

**→ PROMPT:**

```
Polish pass on the basket card specifically:

1. For 'skip' items, show a small "Skipped: <reason>" caption in red-orange below the strikethrough item name — not just a tooltip. Make it visible without hover.
2. Add a summary chip at the top of the basket card: "Thela saved you from 3 bad buys this week →" that when clicked, scrolls to the skipped items.
3. When the agent calls propose_basket and a new item has fairness='skip', briefly highlight it with a yellow-border flash animation (1s).
4. Ensure the "₹X less than Zepto" number is visible in huge type at the top of the card. This is the proof-of-value moment.

Do NOT add animations elsewhere. The basket card is the hero; everything else stays quiet.

Also: add basic loading skeletons to /orders and /basket so first paint doesn't look broken.
```

**Review checklist:**
- [ ] Skipped items feel *present*, not hidden
- [ ] The "saved from" chip reads as a product feature, not a gimmick
- [ ] Total and benchmark are instantly legible

**Commit:** `polish: elevate the 'saved from' moment in the basket card`

---

## Task 11 — Record the Loom + write docs

**Context:** Not an Antigravity task. This is yours. Allocate 3 hours.

Loom (3 min max):
- 0:00–0:20: The problem (Priya buying across 4 apps, confused)
- 0:20–0:40: Thela opens, agent greets, states the good deal + the skip + the total
- 0:40–1:30: Priya edits (in-laws coming, swap items), agent infers the onion leftover
- 1:30–2:00: Commit, delivery slots, "see you Saturday"
- 2:00–2:45: Walk through /orders — the "saved from" summary
- 2:45–3:00: Why AI is load-bearing — one sentence, not a lecture

Docs: write the 11-section portfolio piece per WORKING_FLOW.md section 8. Use `SAMPLE_TRANSCRIPT.md` as source material. Target 8–12 pages of reading time.

**Tools you can use for free:**
- Loom (free tier: 5 min limit, perfect)
- Notion or GitHub Markdown for the writeup
- excalidraw.com for any diagrams you want to include (free, open source)

---

## Task 12 — Deploy (optional but recommended)

**Context:** Having a live URL makes your portfolio 10x more compelling. Vercel + Supabase is free for this scale.

**→ PROMPT:**

```
Prepare this project for Vercel deployment:
1. Push to GitHub if not already
2. Add a `vercel.json` with Node 20 runtime
3. Confirm all env vars are listed in .env.local.example so I know what to set in Vercel
4. Add a brief deployment section to README.md

Do NOT deploy — I'll do the Vercel import from the dashboard to review the env vars.
```

Then go to vercel.com → Import Git Repository → set the 4 env vars → Deploy. Usually works first try.

**Commit:** `chore: prepare for Vercel deployment`

---

## If time is slipping — the cut list

If by Day 2 morning you're behind, cut in this order:

1. **Cut Task 10 polish** (keep the plain version working).
2. **Cut Task 7 order history to a single page** (no detail view).
3. **Cut Task 5 onboarding to one screen** — just household members + notes. Hardcode the rest.
4. **Never cut Task 8** — the agent is the product.
5. **Never cut Task 11** — docs and Loom are what the portfolio actually is.

A working deep AI flow + rough CRUD around it + excellent docs beats a polished CRUD app with a weak agent, every time, for an AI-first PM audience.

---

## Prompts to keep handy (for quick Antigravity fixes)

- **If styling drifts cartoonish:** "Tone down: no emojis, no gradients, no rounded-3xl, stick to slate/neutral palette, font-semibold max, no shadow-2xl."
- **If the agent hallucinates prices:** "The agent is inventing prices — it must only use values returned by `get_current_prices_and_fairness`. Fix the prompt or the tool to make this impossible."
- **If streaming breaks:** "The SSE stream is cutting off mid-token. Verify the Node runtime is explicitly set on the /api/agent route, and that we're flushing after every chunk."
- **If TypeScript is in your way:** "Add `as const` or cast to the right shape — don't weaken the tool input_schema types."

---

## What "done" looks like at the end of Day 2

- [ ] Deployed to Vercel; public URL works
- [ ] You can sign up, onboard, get a basket proposed by the AI, edit it, commit it, see it in history
- [ ] The agent reliably skips at least one item per demo basket with a visible reason
- [ ] The sample-transcript vibe is reproducible in a live run
- [ ] 3-min Loom exists
- [ ] Portfolio doc (8–12 pages) is drafted per WORKING_FLOW.md section 8
- [ ] README on GitHub links to the Loom and the live URL

Ship it.
