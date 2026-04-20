# Thela — Working Flow Document

> Living context document for the AI-first PM portfolio project. Captures the committed direction so work can resume without re-deriving.

**Last updated:** 2026-04-21
**Owner:** Abhishek (arjha97@gmail.com)
**Timeline:** 2-day sprint

---

## 0. Pivot note

Original direction (Sarathi — a B2B AI procurement agent for independent restaurants) was scoped, specced, and rejected by the owner as too B2B / emotionally flat / AI-forced. Pivoted to a B2C household grocery product with Otipy-like operational shape but an AI-native consumer experience. Sarathi artifacts are discarded; this doc is the replacement of record.

---

## 1. The brief (calibrated)

| Dimension | Decision |
|---|---|
| Purpose | PM portfolio piece to apply for PM jobs |
| Primary audience | AI-first / GenAI product teams |
| Space | B2C fresh produce + groceries for Indian Tier-1 households |
| Model inspiration | Otipy (B2C, farm-linked, next-morning delivery) |
| Launch geography | Tier-1 metro (Bengaluru as default) |
| PM skills to showcase | 0→1 strategy, user research/discovery, AI-native product design |
| AI depth | Load-bearing on one core flow; rest uses AI sparingly |
| Deliverable | Full-stack MVP (hybrid: 2–3 flows, one deep AI-native) + documentation |
| Stack | Next.js + Supabase/Postgres + Claude/OpenAI API |
| Primary persona | Working urban professional (28–38), dual-income, time-poor |
| Emotional hook | "I'm finally not getting cheated on price or quality" |

---

## 2. Competitive landscape (consumer grocery lens)

- **Zepto / Blinkit / Instamart** — 10-min delivery. Optimized for impulse, not weekly shop. Surge pricing is legitimate consumer pain point.
- **BigBasket / Amazon Fresh / JioMart / Flipkart Minutes** — scheduled delivery, broader SKU set. Lower perceived freshness than a vendor.
- **Otipy** — community-reseller B2C; farm-linked; next-morning model. Strong in Delhi-NCR. Proof that a more "honest" grocery experience has demand.
- **Country Delight / Licious / Fraazo (RIP) / Deep Rooted** — category-specific freshness plays. Mixed outcomes.
- **Local vegetable vendors + kiranas** — still the default for most middle-class households. Trusted, slow, opaque on price.

**The gap Thela targets:** no grocery app today represents the *buyer's interests*. Every app is incentivized to maximize SKU margin. Thela monetizes via subscription / fixed take-rate, which lets the AI genuinely advocate for the user — including telling them not to buy things.

---

## 3. Committed product concept

**Working name:** Thela (placeholder)

**One-line thesis:**
> Urban professionals overpay and over-compromise on quality because grocery apps optimize for speed, not fairness. Thela is the first grocery app where an AI works for the buyer, not the platform — curating a weekly basket at honest farm-linked prices, flagging when something isn't worth buying this week, and proving fairness item by item.

**Headline AI moment:** the AI will actively tell you *not* to buy things this week. No grocery app does this because they're incentivized against it.

---

## 4. Persona — Priya

- 32, product manager, Bengaluru (Indiranagar)
- Husband is a consultant. No kids yet. HHI ~₹40L.
- Cooks dinner most weekdays, orders in 2–3x/week, eats out weekends.
- Current grocery stack:
  - Zepto for urgent (~2–3x/week, ₹400 avg) — knows she's overpaying
  - BigBasket monthly for staples (~₹4000)
  - Local vegetable vendor for fresh — trusts quality, not price
  - Weekend supermarket run when she has time
- **Named pain:** "I know I'm overpaying on Zepto. Half of what I buy from BB goes bad before I use it. I just want someone to handle this honestly."
- **Unnamed pain:** cognitive load of deciding what to buy and where, every single time.

---

## 5. The three flows

### Flow 1 (DEEP, AI-native): Weekly Basket Review
Priya opens the app Sunday evening. Basket is pre-composed by the agent based on household profile + past behavior + current prices + seasonality. Each item shows a fairness badge (green/amber/skipped-with-reason) and a one-line rationale. Conversational edits. Commit places the order.

### Flow 2 (BASIC): Household profile & onboarding
Short onboarding: household members, dietary defaults, rough weekly cooking pattern, staples brand preferences. Seeds the first basket. Editable later.

### Flow 3 (BASIC): Order history + weekly fairness report
After delivery: what arrived, what was "saved" vs. Zepto/retail baseline, running weekly spend, and "items we saved you from buying this week." Reinforces trust loop.

---

## 6. 2-day build plan

### Day 1
- **Morning (3–4h):** Next.js scaffold, Supabase auth, tables (`users`, `households`, `items`, `baskets`, `orders`, `prices`). Seed 40 SKUs with seasonality metadata + 3 fake price columns (Zepto-like, BB-like, own) for fairness logic.
- **Afternoon (4–5h):** Onboarding flow (Flow 2). Household profile + preferences + trigger first basket.
- **Evening (2h):** Static UI shell for Basket Review + Order History. Layout only.

### Day 2
- **Morning (5–6h):** Deep AI flow (Flow 1). Claude Sonnet with tool use. Tools: `get_household_profile`, `get_consumption_history`, `get_current_prices_and_fairness`, `propose_basket`, `commit_basket`. Chat UI + live-updating basket card with fairness badges.
- **Afternoon (3h):** Order history + fairness-summary view. Wire "saved ₹X vs. Zepto" computation.
- **Evening (3–4h):** Docs + 3-min Loom walkthrough. Protect this time.

### Out of scope (explicit)
- Real delivery routing, payments, KYC
- Vendor-side app
- Mobile-native build (responsive web OK)
- Mid-week top-up flow (deferred to v0.5, narrated in docs)
- Actual sourcing logistics (hand-waved in docs)

---

## 7. Why AI is load-bearing (for docs & reviewers)

1. **Basket composition** — agent builds a household's recurring basket from profile + consumption history + seasonality + price intelligence. Not a static subscription.
2. **Fairness scoring** — LLM pipeline synthesizes mandi prices, competitor prices, and own cost to produce a per-item weekly fairness score. A novel product surface.
3. **Swap reasoning** — when an item is overpriced or off-season, agent proposes a substitute *with a conversational explanation* — not a silent swap.
4. **The "don't buy" veto** — AI actively tells the user not to buy things this week when quality or price fails a threshold. Defensible because Thela's business model doesn't depend on per-SKU margin.

Remove the LLM and this is a subscription box — a category that has repeatedly failed. With it, it's a product that can defend why a reviewer should care.

---

## 8. Documentation outline (8–12 pages, one Markdown/Notion doc)

1. One-line thesis
2. Why this problem, why now
3. Discovery approach and honest limitations
4. Persona (Priya) & JTBD
5. Product concept and the AI-native unlock (with sample basket + transcript)
6. Product walkthrough (3 flows, screenshots/Loom)
7. Metrics: North Star (basket-commit rate, or retention W4 cohort?) + input tree
8. Trade-offs and what I said no to (no fridge photos; no B2B; no sub-10-min delivery)
9. What I'd build next (6-month roadmap: mid-week top-ups, WhatsApp channel, recipe-to-basket, household sharing, city expansion)
10. Risks, failure modes, kill criteria
11. Appendix: competitive landscape table

---

## 9. Open questions / parking lot

- Final product name (Thela is placeholder — Basket, Soch, Hisab, Mandi also candidates)
- Business model for the doc: subscription (₹99/month?) vs. flat take-rate vs. hybrid
- North Star metric — W4 retention? Basket-commit rate? % spend through Thela?
- Delivery cadence in v0 narrative: 1 weekly, 2 split drops, or daily fresh + weekly staples?
- Whether to explicitly benchmark against Otipy + Zepto in the docs or stay abstract

---

## 10. Current working step

**Done:** Sample transcript committed; user approved direction. Weekly Basket Review spec, system prompt v0, DB schema v0, and tool contracts drafted (see companion files).

**Next up:** Either (a) draft docs sections 1–2 (thesis + "why now") so there's a voice sample to iterate on, or (b) start Day-1-morning scaffolding (Next.js + Supabase + schema migration + seed data). Pending user direction.

## 11. Companion artifacts

- `WORKING_FLOW.md` — this file, working context
- `SPEC_BASKET_REVIEW.md` — feature spec for the deep AI flow ✓
- `AGENT_PROMPT.md` — system prompt v0 ✓
- `SCHEMA.sql` — database schema v0 ✓
- `TOOL_CONTRACTS.md` — tool input/output shapes ✓
- `SAMPLE_TRANSCRIPT.md` — annotated example session ✓
- `BUILD_PLAYBOOK.md` — ordered Antigravity task list with paste-ready prompts ✓

Planning artifacts complete. Remaining: execute the playbook (Tasks 1–12), write portfolio docs (sections 1–11), record 3-min Loom.

## 12. Build approach

- **IDE:** Antigravity (agent-driven). Prompts pre-written in `BUILD_PLAYBOOK.md`.
- **Stack:** Next.js 14 + Supabase + Claude Sonnet + Tailwind + shadcn/ui.
- **LLM budget:** ~$5–20 for 2 days. Anthropic credit funded.
- **Review discipline:** read every Antigravity diff before accepting. Commit after each task completes cleanly.
- **Cut list (if slipping):** polish → order detail → onboarding screens. Never cut the agent or the docs.
