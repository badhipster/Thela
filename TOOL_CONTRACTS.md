# Thela — Agent Tool Contracts (v0)

**Flow:** Weekly Basket Review
**Agent host:** Next.js server action / Edge function
**LLM:** Claude Sonnet with native tool use
**Status:** v0 — shapes, not code

These are the *only* tools the agent can call. The LLM never writes to UI state directly — all basket changes go through `propose_basket`. This gives us one deterministic, auditable surface.

---

## Tool 1 — `get_household_profile`

**Purpose:** Read the household's identity, preferences, and any free-text notes.

**Input:** none

**Output:**
```json
{
  "household_id": "uuid",
  "members": [
    { "name": "Priya", "age_band": "adult", "diet": "veg" },
    { "name": "Rohan", "age_band": "adult", "diet": "eggetarian" }
  ],
  "diet_default": "eggetarian",
  "cooking_pattern": {
    "home_dinners_per_week": 5,
    "cuisine_tilt": "north_indian",
    "spice_level": "medium"
  },
  "staple_preferences": {
    "paneer_brand": "Milky Mist",
    "atta_brand": "Aashirvaad Whole Wheat",
    "dahi_size_default_g": 400
  },
  "notes": "In-laws visiting Thursday, add fruit"
}
```

---

## Tool 2 — `get_consumption_history`

**Purpose:** Read the last N weeks of committed + skipped items so the agent can learn household rhythm.

**Input:**
```json
{ "weeks": 4 }
```

**Output:**
```json
{
  "weeks": [
    {
      "week_start": "2026-04-14",
      "committed_items": [
        { "name": "Tomato (Kolar, A-grade)", "quantity": 1.0, "unit": "kg" },
        { "name": "Onion", "quantity": 0.5, "unit": "kg", "note": "user_reduced_from_usual" }
      ],
      "skipped_by_agent": [
        { "name": "Capsicum", "reason": "price_spike" }
      ],
      "removed_by_user": []
    }
    // ... 3 more weeks
  ],
  "detected_patterns": [
    {
      "type": "leftover_inferred",
      "sku": "Onion",
      "note": "Quantity trending down WoW — likely leftover in pantry"
    },
    {
      "type": "skip_streak",
      "sku": "Dahi",
      "note": "Skipped last 1 week; typically weekly"
    }
  ]
}
```

---

## Tool 3 — `get_current_prices_and_fairness`

**Purpose:** Retrieve current-week prices + fairness verdicts for a set of SKUs.

**Input:**
```json
{ "sku_names": ["Tomato (Kolar, A-grade)", "Capsicum", "Paneer (Milky Mist 200g)"] }
```

**Output:**
```json
{
  "week_start": "2026-04-20",
  "items": [
    {
      "id": "uuid",
      "name": "Tomato (Kolar, A-grade)",
      "unit": "kg",
      "thela_price": 28,
      "zepto_price": 52,
      "bb_price": 44,
      "fairness": "green",
      "fairness_reason": "Kolar harvest strong; ~46% below Zepto",
      "confidence": 0.95,
      "seasonality_tag": "in_season"
    },
    {
      "id": "uuid",
      "name": "Capsicum",
      "unit": "kg",
      "thela_price": 180,
      "zepto_price": 195,
      "bb_price": 185,
      "fairness": "skip",
      "fairness_reason": "Unseasonal imports; +78% WoW; quality inconsistent",
      "confidence": 0.9,
      "seasonality_tag": "unseasonal"
    }
  ]
}
```

---

## Tool 4 — `get_seasonality_signals`

**Purpose:** Global context for the week — what's peaking, what's shifting, any supply-chain events the agent should mention.

**Input:**
```json
{ "week_start": "2026-04-20" }
```

**Output:**
```json
{
  "in_season": ["Tomato (Kolar)", "Mango (Alphonso - starting)", "Watermelon"],
  "peaking": ["Mango (Banganapalli)"],
  "unusual_movers": [
    {
      "item": "Capsicum",
      "direction": "up",
      "pct_move": 78,
      "reason": "Unseasonal imports after Maharashtra rain"
    },
    {
      "item": "Paneer",
      "direction": "down",
      "pct_move": -6,
      "reason": "Dairy surplus post-festival"
    }
  ]
}
```

---

## Tool 5 — `propose_basket`

**Purpose:** The *only* way the agent updates the basket card UI. Called on every meaningful edit.

**Input:**
```json
{
  "basket_id": "uuid (existing or null on first call)",
  "items": [
    {
      "item_id": "uuid",
      "quantity": 1.5,
      "unit_price": 28,
      "fairness": "green",
      "fairness_reason": "Kolar harvest strong; ~46% below Zepto",
      "agent_note": "Bumped from usual 1 kg — great week for it"
    },
    {
      "item_id": "uuid",
      "quantity": 0,
      "unit_price": 180,
      "fairness": "skip",
      "fairness_reason": "Unseasonal imports; +78% WoW",
      "agent_note": "Skipped this week; zucchini proposed as substitute"
    }
  ],
  "total": 2188,
  "benchmark_zepto": 2789,
  "benchmark_bb": 2528
}
```

**Output:**
```json
{
  "basket_id": "uuid",
  "rendered": true,
  "ui_state_hash": "sha1..."
}
```

---

## Tool 6 — `commit_basket`

**Purpose:** Finalize the basket and place the order. Gated by explicit user commit verb (enforced in the system prompt).

**Input:**
```json
{ "basket_id": "uuid" }
```

**Output:**
```json
{
  "order_id": "uuid",
  "delivery_slot_fresh": "2026-04-21T08:00:00+05:30",
  "delivery_slot_staples": "2026-04-24T08:00:00+05:30",
  "total_amount": 2188,
  "confirmation_message": "Order placed — fresh Tue 8 a.m., staples Fri 8 a.m."
}
```

---

## Error handling shape (all tools)

On failure, return:
```json
{
  "error": {
    "code": "price_feed_stale" | "sku_not_found" | "commit_forbidden" | "internal",
    "message": "Human-readable reason",
    "retryable": true
  }
}
```

The agent is instructed (in the system prompt) to surface the failure to the user and propose a fallback, not to silently retry or guess.

---

## Why this shape

1. **Single UI-writing tool (`propose_basket`).** One surface to test, audit, and instrument. Every basket change flows through it.
2. **Commit is a separate, privileged tool.** Prevents accidental commits and gives us a natural place to enforce the commit-gate rule in code (belt-and-suspenders with the prompt rule).
3. **Read tools return `detected_patterns` where relevant.** We pre-compute patterns server-side instead of making the LLM infer them from raw history — cheaper, more deterministic, and easier to evaluate.
4. **Errors include a `retryable` flag.** The agent's behavior on non-retryable errors (e.g., `sku_not_found`) should be different from transient issues — signaling this in the return shape keeps the prompt simpler.
