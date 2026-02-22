V501 Addendum — Empire Slots Placement & Final Polish
Status: Locked
Purpose: Define the exact placement and final UX polish for Empire Slots, based on review feedback.
This addendum does not modify any mechanics, probabilities, or rules from V501.

12. Placement in Main UI (Final, Non‑Negotiable)
Empire Slots must appear below the Texas Hold’em Bonus button and above Ad Rewards.

Final order:

Code
[ DEAL ]
[ Texas Hold’em Bonus ]
[ Empire Slots 🎰 ]
[ Ad Rewards ]
Rules:

Empire Slots must never appear above Texas Hold’em Bonus.

Empire Slots must never appear in the header or building section.

Empire Slots must not shift or resize other UI elements.

Button style must match Texas Hold’em Bonus (same width, same padding, same font).

This creates a clean “Side‑Game Strip” at the bottom of the gameplay area.

13. Review‑Driven Micro‑Tweaks (Locked)
These are polish‑only and do not change core mechanics.

13.1 High Stakes Wager Floor
To prevent edge‑case weirdness:

Code
wager = max(2, floor(chips * 0.5))
This ensures:

High Stakes always costs at least 2 chips.

No 0‑chip or 1‑chip spins.

No drift in expected value.

13.2 Optional RTP‑Friendly Multiplier Table
If you choose to adopt the “slightly player‑favored” version:

Code
2× → 75%
3× → 18%
4× → 5%
5× → 1.5%
10× → 0.5%
This raises RTP to ~105% and makes Low Stakes feel more fun.
This is optional and not required by V501.

13.3 Optional Cooldown
If implemented:

Global cooldown: 30 seconds

Applies to both modes

Displayed clearly under SPIN button

Does not persist across reloads

This prevents spam without forcing long waits.

13.4 Reel Symbol Set
Use a simple, readable symbol set:

♠ Spade

♥ Heart

♦ Diamond

♣ Club

⭐ Star

7

BAR

Cherry

These symbols are universally understood and mobile‑friendly.

14. Zero‑Drift Enforcement
This addendum must not:

Change any multiplier values unless you explicitly adopt the optional table.

Change any wager formulas except the 2‑chip floor.

Add new reward types.

Add new modes.

Add new save fields.

Modify prestige, reset, buildings, boosts, or economy.

This addendum only defines:

Placement

UI polish

Optional RTP tuning

Wager floor safety

Everything else remains exactly as defined in V501.

⭐ 15. Success Criteria (Updated)
Empire Slots is considered correctly implemented when:

It unlocks only after the first Pro Dealer.

It appears under Texas Hold’em Bonus.

It uses the exact High/Low Stakes rules from V501.

It uses the exact multiplier table (or the optional one if chosen).

It never breaks the idle economy.

It remains fully optional and non‑blocking.

It feels like a premium casino side‑game, not a core mechanic.