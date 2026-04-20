# Feature Spec — Weekly Basket Review

**Product:** Thela
**Flow:** Flow 1 (deep, AI-native)
**Status:** v0 — spec only, pre-build
**Owner:** Abhishek

---

## Problem

Priya (our target household shopper) shops across three or four channels — Zepto for urgent, BigBasket for staples, a local vegetable vendor for fresh, a weekend supermarket run — because none of them represents her interests. Each is optimized for its own margin, none for her weekly cognitive load, none for seasonality-aware fairness. She overpays, over-wastes, and over-decides.

## Goal

Compress the weekly household grocery decision into a ≤2-minute supervised review, in which the AI arrives with a defensible pre-composed basket, the user edits conversationally, and commits to a split delivery for the week.

## Non-goals (v0)

- Mid-week top-ups (v0.5)
- Recipe-to-basket generation (v1)
- Multi-user household accounts with shared edits (v1)
- Price negotiation with vendors (never — the business model is fixed take)
- Sub-60-minute delivery (never — that's Zepto's game)

## User story

> As Priya, on Sunday evening, I want my week's grocery basket to arrive pre-composed by an AI that knows my household and the market, so I can spend 2 minutes reviewing and editing instead of 45 minutes deciding across apps.

## Trigger

Weekly, Sunday 7 p.m. IST (user-configurable). Push + WhatsApp notification. User can also invoke mid-review from the home screen. Mid-week top-up flow is out of scope for v0 but the chat entrypoint exists.

## Inputs the agent reads before opening

- `household_profile` — members, diet, staples brand preferences, rough cooking pattern, free-text notes
- `consumption_history` — 4 weeks of delivered items + skipped/edited items (the edit graph matters more than the commit list)
- `current_prices_and_fairness` — per-SKU: own price, competitor benchmark (Zepto, BB), fairness verdict (green / amber / skip) + reason
- `seasonality_signals` — what's in season this week, what's peaking, what's unseasonal

## Opening behavior

The agent does not open with "How can I help you?" It opens with a proposed basket. The opener must:

- Greet once, warmly but briefly.
- Surface 2–3 specific observations — at least one "good deal" moment, at least one "skip" with reason.
- State the running total and the comparative number ("X less than Zepto").
- Invite review. Do not dump the full list in chat; the basket card carries that weight.

## Conversation shape

- Language: Hinglish-default, mirrors the user.
- Tone: warm, confident, never hedging. Mildly opinionated — defining product feature, not a bug.
- Structured outputs (`propose_basket`) update the basket card live.
- Agent asks clarifying questions when an edit is genuinely underspecified ("fruit for them" → what kind?).
- Agent proactively surfaces inferences from history when they save money or reduce waste.

## Fairness voice (the defining trait)

The agent is willing to tell the user NOT to buy something. When the fairness verdict is amber or skip:
- Name the item.
- Give one concrete reason (price spike %, off-season, quality).
- Propose a substitute when a reasonable one exists.
- Respect any explicit override — don't lecture.

## Commit gate (hard rule)

Agent may not call `commit_basket` without an explicit commit verb this turn: `commit`, `confirm`, `order kar do`, `place it`, `go ahead`. Ambiguous ("looks good", "fine") → ask once more.

Every amber or skip item must be explained before the user commits.

## Tools exposed to the agent

1. `get_household_profile()`
2. `get_consumption_history(weeks=4)`
3. `get_current_prices_and_fairness(sku_names)`
4. `get_seasonality_signals(week_start)`
5. `propose_basket(basket)` — the *only* way the basket card updates
6. `commit_basket(basket_id)`

Detailed shapes: see `TOOL_CONTRACTS.md`.

## Edge cases worth writing down

- User wants something the AI has flagged as "skip" → let them override, log the override, don't lecture.
- User asks for an SKU Thela doesn't carry → say so, offer nearest substitute, mark for sourcing-demand backlog.
- Fairness computation stale / price feed down → agent surfaces flag before commit, proposes last-known-good with disclaimer.
- User goes silent mid-review → save draft, remind at 7 a.m. Monday if un-committed.
- Household note conflicts with profile ("husband out of town this week, reduce quantities") → respect the note, don't permanently mutate profile.
- User tries to talk about non-grocery topics → polite redirect.

## Success metrics

| Metric | Target (by wk 8) |
|---|---|
| Weekly review completion rate | > 65% |
| Baskets committed with ≤ 3 edits | > 50% (rising WoW = learning working) |
| Median time-to-commit | < 3 min |
| ₹-saved-vs-benchmark per week | Audited against sampled receipts |
| W4 / W12 retention (the actual North Star) | To be defined from pilot |

## Why AI is load-bearing here

1. **Basket composition** — agent synthesizes household profile + 4-week history + current prices + seasonality. Not a static subscription.
2. **Fairness scoring** — LLM pipeline synthesizes mandi prices, competitor prices, and own cost to produce a per-item weekly fairness verdict. Novel product surface.
3. **Swap reasoning** — conversational explanations, not silent swaps.
4. **"Don't buy" veto** — AI tells the user not to buy things this week. Defensible because the business model doesn't depend on per-SKU margin.

Remove the LLM and this is a subscription box — a category that has repeatedly failed. With it, Thela is a product that defends why a reviewer should care.

## Known risks / honest disclosures

- The "₹X less than Zepto" number is the most fragile claim in the product. In v0 the benchmark data is seeded; docs must flag this as illustrative and describe the audit methodology for production.
- The system prompt will drift in real testing; v0 is a starting point. Iteration story itself is portfolio-worthy.
- Mid-week top-up is conspicuously out of v0 scope. Docs should pre-empt reviewer questions with an explicit sequencing argument.
