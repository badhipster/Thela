# Thela — Sample Agent Conversation (annotated)

A realistic Sunday-evening session with the Weekly Basket Review agent. Intended for the portfolio doc's "product concept" section and as a reference for evaluating real runs against expected behavior.

**Scenario:** Priya, 32, PM in Bengaluru. Sunday 9:47 p.m. Has used Thela 6 weeks. Husband, Rohan, is eggetarian. In-laws visiting this Thursday — note already left in household profile earlier in the day.

**UI state:** Split view. Left = chat. Right = live basket card (~18 items, colored fairness dots, running total, "₹X less than Zepto" headline, strike-through on skipped items with hover-reason).

---

### Turn 1 — Agent opener (proactive, no user prompt)

> **Thela:** Hi Priya. Your basket is ready for this week — 18 items, ₹1,842. Three things worth flagging before you commit:
>
> — **Tomatoes are having a good week.** Kolar harvest is strong, ₹28/kg in your basket vs. ₹52 on Zepto right now. I've added 1.5 kg, a bit more than your usual.
>
> — **Skipping capsicum.** Wholesale is ₹180/kg this week — unseasonal imports after the Maharashtra rain. I've left it off. Zucchini is ₹85 and works for your usual stir-fry. Want me to swap in 300g?
>
> — **Paneer — which one?** You bought Milky Mist last week and Amul the week before. Milky Mist is ₹12 cheaper per 200g this week. Default to that?
>
> Review the list on the right and tell me what to change. I'll confirm when you commit.

**Annotations:**
- Opener proves homework with 3 specific, non-generic observations (good deal + skip + preference inference).
- At least one "good deal" + one "skip" — matches system-prompt rule.
- Total + benchmark stated upfront.
- Does not dump the 18-item list in chat — card carries it.

---

### Turn 2 — User edits, mixes planned + unplanned

> **Priya:** yeah swap in zucchini. also in-laws coming Thursday — add paneer 500g, peas 500g, and some fruit for them, they like anaar

**Annotations:**
- Fragmented Hinglish input; agent must handle.
- "Fruit for them" is underspecified — but user has already narrowed it to anaar.
- Agent should expect a follow-up clarifying edit for the "some fruit" quantity (handled below).

---

### Turn 3 — Agent confirms edits + introduces fairness pushback

> **Thela:** Got it. Added:
>
> — Zucchini 300g — ₹26
> — Paneer 500g (Milky Mist) — ₹178
> — Green peas 500g — ₹42
> — Pomegranate 500g — ₹118
>
> Two notes on the anaar: pomegranate is decent quality right now but ₹235/kg — about what you'd pay anywhere, not a great deal. Want to keep, or I can swap to sweet lime which is peaking at ₹60/kg and also in-law-friendly?
>
> New total: ₹2,206.

**Annotations:**
- Short confirmation with line items + prices so the user can verify.
- Fairness voice applied to anaar — "decent, but not a great deal" — not forcing a swap, giving the user agency.
- Substitute proposed with reason ("peaking at ₹60/kg, in-law-friendly") — a concrete alternative, not generic "we have other fruits."
- Updated total stated.

---

### Turn 4 — User overrides fairness advice

> **Priya:** keep anaar, they specifically like it

**Annotations:**
- Classic override case: fairness advice < preference.
- Agent must respect override and not lecture (hard rule).

---

### Turn 5 — Agent respects override + surfaces two history-based inferences

> **Thela:** Noted. Anything else before you commit? Two things I want to double-check:
>
> — Your usual **1 kg onions** — you have half a kg leftover from last week based on what wasn't ordered. Keeping at 1 kg or reducing to 500g?
>
> — You skipped dahi last week. Adding back in the 400g tub you usually get, or still pausing?

**Annotations:**
- No lecture on anaar — matches hard rule.
- Two proactive inferences from `detected_patterns` in consumption history:
  - `leftover_inferred` on onion → saves money + reduces waste.
  - `skip_streak` on dahi → prevents silent habit drift.
- Both phrased as options, not directives. Keeps user in control.
- This is the "magical" moment reviewers will remember — the agent is *modeling the household*, not just the basket.

---

### Turn 6 — User edits, short form

> **Priya:** reduce onion to 500g. add dahi

---

### Turn 7 — Agent presents final state + delivery plan + commit prompt

> **Thela:** Done. Final basket: 20 items, ₹2,188 — ₹601 less than Zepto, ₹340 less than BigBasket on the same list.
>
> Deliveries split as usual: fresh on Tuesday 8 a.m., staples + dairy Friday 8 a.m.
>
> Say **commit** to place the order, or tell me what to change.

**Annotations:**
- Explicit commit verb instruction — matches commit-gate hard rule.
- Final benchmarks re-stated as the product's "ROI receipt."
- Delivery plan surfaced before commit so there are no surprises.

---

### Turn 8 — User commits

> **Priya:** commit

---

### Turn 9 — Order placed + retention hook for next week

> **Thela:** Ordered. You'll see confirmation in the app and on WhatsApp. I'll check in Saturday with next week's basket.
>
> One thing to flag for next week: mango season is starting and Alphonso is landing in Bengaluru around Wednesday. Want me to include a kg in next week's basket, or only if you tell me to?

**Annotations:**
- Commit acknowledged, confirmation channel stated.
- "I'll check in Saturday" — sets the weekly rhythm explicitly.
- Mango teaser is a deliberate retention hook disguised as conversation. Plants anticipation for the next review. This is product design inside prompt design.

---

## Why this transcript works (for the doc)

1. **The opener proves homework.** Three specific observations within 3 seconds = instant trust.
2. **The "skip" is the headline.** Capsicum being left out of the basket is the moment Thela differs from every grocery app. It's also the moment that *proves the business model* (subscription, not markup) is load-bearing.
3. **Conversational editing feels fluid.** "In-laws coming Thursday" isn't a form input, it's life, and the agent handles the implied additions without friction.
4. **The anaar pushback → override → respect cycle is the fairness ethic made tactile.** Agent tells her she's not getting a deal, then respects her when she overrides. Builds trust faster than any "best price guaranteed" banner.
5. **The onion inference is quiet intelligence.** Noticing she ordered less last week and carrying that forward signals the agent is modeling the household, not just the basket.
6. **The commit gate is explicit.** Matches hard-rule design — no false-positive commits.
7. **The sign-off plants next week's hook.** Mango teaser = retention mechanic in conversation design.

## What's deliberately NOT in the transcript

- Photos of items, nutrition info, recipes, product comparisons — these exist in a real product but would distract from the *agent behavior* demo.
- Messier user input (typos, pure-voice dictation, "add kuch paneer wagera"). The portfolio doc should include 1–2 messier exchanges as a separate appendix to show the prompt handles real-world input.

## Honest risks

- **The "₹601 less than Zepto" number** is the most fragile claim in the product. In v0 the benchmark data is seeded; docs must flag this as illustrative and describe the audit methodology for production.
- **The tone is suspiciously clean.** Real users are messier. Portfolio version should show 1–2 sloppy exchanges for credibility.
