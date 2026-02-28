ADR‑04 (Hardened Version): Deterministic Horizontal Chip Odometer
Status: Proposed
Date: 2026‑02‑28
Owner: Daniel
Scope: UI-only — Poker Idle Empire top‑bar chip display & growth feedback loop
Non‑Scope: No game logic, no buildings, no multipliers, no upgrades, no economy changes

1. Context
The current chip display:

Shows a static formatted number (e.g., 2163717.1T)

Updates once per second

Does not visually reflect real CPS speed

Does not differentiate low vs high CPS players

Feels static and spreadsheet‑like

The goal is to replace this with a deterministic, real‑time, horizontal odometer that visually expresses chip growth without altering any underlying game mechanics.

2. Scope (Hard Boundary)
This ADR covers ONLY:
The visual representation of the chip total

The animation behaviour of digits

The UI component inside the existing pillbox

The mapping from real chip value → digit slots

The animation rules for low/mid/high CPS

The Escape & Relocate compression behaviour

This ADR explicitly does NOT cover:
Buildings

Upgrades

Multipliers

Pro Dealers

Game economy

CPS calculation

Any new game mechanic

Any new state variable

Any new progression system

Any new bonus system

If it changes the number of chips or CPS, it is OUT OF SCOPE.
If it changes how chips or CPS are calculated, it is OUT OF SCOPE.
If it adds a new building or upgrade, it is OUT OF SCOPE.
This ADR is UI-only and read-only relative to game logic.

3. Core Principle
The odometer must be a pure function of:

chips (authoritative total)

cps (authoritative rate)

It must never:

modify chips

modify cps

introduce new multipliers

introduce new bonuses

introduce new buildings

introduce new state

It is a display layer, not a game mechanic.

4. Decision
We will implement a horizontal, eased, deterministic odometer inside the existing pillbox.

The odometer:

Reads chip values

Converts them into digit slots

Animates digit changes horizontally

Uses tiered animation rules

Compresses animation during Escape & Relocate

Never simulates or fakes chip gain

This is a UI transformation, not a gameplay change.

5. Behavioural Contract
5.1. Determinism
The odometer must reflect real chip values exactly.

No smoothing, interpolation, or fake increments.

No animation may imply chips are increasing faster or slower than they are.

5.2. Read‑only
The odometer must not modify game state.

The odometer must not introduce new state.

The odometer must not depend on any building or upgrade system.

5.3. Independence from game logic
The odometer must work even if the game had zero buildings.

The odometer must work even if the game had no upgrades.

The odometer must work even if the game had no multipliers.

It depends only on chips and cps.

6. Explicit Non‑Goals (Foolproofing)
The odometer implementation must not:

Add a new building

Add a new upgrade

Add a new multiplier

Add a new bonus

Add a new progression system

Modify CPS

Modify chip gain

Modify the economy

Modify any existing building logic

Modify any existing upgrade logic

Modify any existing multiplier logic

If a future developer or AI tries to attach a feature like “Pro Dealers” to this ADR, that is a violation of scope.

7. Implementation Notes
7.1. Allowed changes
New UI component(s)

New animation logic

New digit slot renderer

New formatting logic

New easing curves

New pillbox layout adjustments

7.2. Forbidden changes
Anything that touches game logic

Anything that touches CPS

Anything that touches chip generation

Anything that touches buildings

Anything that touches upgrades

Anything that touches multipliers

8. Acceptance Criteria
ADR‑04 is complete when:

The odometer animates digits correctly

The odometer reflects real chip values exactly

The odometer differentiates low/mid/high CPS visually

Escape & Relocate compression works

No game logic was modified

No new mechanics were introduced

No new multipliers or bonuses were added

No buildings or upgrades were added

If any gameplay system changes, ADR‑04 has been violated.

9. Final Lock
ADR‑04 is a UI‑only specification.
It must never be interpreted as a gameplay feature.
It must never introduce or modify any game logic.
It must never reference buildings, upgrades, or multipliers.