# TODO.md — Deterministic Horizontal Chip Odometer (ADR‑04 Implementation)

This TODO file defines the exact tasks, constraints, and acceptance criteria required to implement the deterministic horizontal odometer described in ADR‑04.

**This feature is UI-only.**
It must not modify game logic, CPS, chip generation, buildings, upgrades, multipliers, or any economy system.

## Phase 1 — Foundation & Architecture

### 1.1 Create Odometer Component Structure
- [ ] Create `src/lib/components/odometer/Odometer.svelte`
- [ ] Create `src/lib/components/odometer/DigitSlot.svelte`
- [ ] Create `src/lib/components/odometer/DigitRail.svelte`
- [ ] Add props:
  - `value: number`
  - `suffix: string | null`
  - `tier: number`
- [ ] Add internal state for digit arrays

**Acceptance Criteria**
- Component renders without errors
- No game logic touched
- No new stores created

### 1.2 Integrate into Existing Pillbox
- [ ] Locate `.chip-capsule` in `src/routes/app/+page.svelte`
- [ ] Replace static `formatNumber($chips)` with `<Odometer value={$chips} />`
- [ ] Preserve existing layout, icon, and CPS label

**Acceptance Criteria**
- Pillbox layout unchanged except for number rendering
- No visual regressions outside the pillbox

## Phase 2 — Core Odometer Logic

### 2.1 Deterministic Value → Digit Conversion
- [ ] Implement function to convert integer chip value into digit array
- [ ] Implement suffix extraction (K/M/B/T)
- [ ] Ensure no rounding errors
Suffix strategy is display-only  
Suffix (K/M/B/T) is purely visual; it must not affect underlying chip value or CPS.

**Acceptance Criteria**
- Digit array always matches real chip value
- No smoothing, interpolation, or fake increments

### 2.2 Horizontal Slide Animation
- [ ] Implement eased slide-left animation in `DigitSlot.svelte`
- [ ] Use cubic ease-in-out
- [ ] Trigger animation only when digit changes

**Acceptance Criteria**
- Animation is smooth, deterministic, and tied to real value changes
- No animation occurs without a real digit change

### 2.3 Tiered Animation Rules
- [ ] Implement Tier 1 (all digits animate)
- [ ] Implement Tier 2 (last 3–4 digits animate)
- [ ] Implement Tier 3 (last 1–2 digits animate)
- [ ] Add tier selection logic based on chip magnitude

**Acceptance Criteria**
- Tier transitions are seamless
- High CPS does not cause unreadable blur
- Low CPS feels slow and chunky

## Phase 3 — Advanced Features

### 3.1 Escape & Relocate Compression
- [ ] Freeze left digits during relocation
- [ ] Animate only last 1–2 digits
- [ ] Update frozen block every 0.1s
- [ ] Ensure no fake chip gain is shown
Where Escape & Relocate comes from  
### 3.11 Escape & Relocate Compression:
- Source of truth for “relocation active” must be an existing UI/game 
- flag; the odometer must not introduce its own relocation state or 
- change relocation behaviour.

**Acceptance Criteria**
- Compression visually stable
- No drift between displayed and real chip value

### 3.2 Easing Curve Library
- [ ] Create reusable easing functions
- [ ] Ensure consistent timing across tiers

**Acceptance Criteria**
- All digit animations use the same easing curve family
- No jitter or snapping

## Phase 4 — Integration & Polish

### 4.1 Replace Existing Chip Display
- [ ] Remove old bump/sparkle animations
- [ ] Remove direct `formatNumber($chips)` usage
- [ ] Ensure CPS label remains unchanged

**Acceptance Criteria**
- Only the odometer controls chip display
- No leftover animation artifacts

### 4.2 Performance Optimization
- [ ] Batch digit updates
- [ ] Avoid unnecessary re-renders
- [ ] Ensure animation cost is O(number of animated digits)

**Acceptance Criteria**
- Smooth performance on low-end devices
- No frame drops at high CPS

## Phase 5 — Testing & Validation

### 5.1 Deterministic Behavior Tests
- [ ] Test with CPS = 1, 10, 100, 1000, 1M
- [ ] Verify animation speed matches real CPS
- [ ] Verify no drift between chips and displayed digits

**Acceptance Criteria**
- Display always matches real chip value
- No fake increments or smoothing

### 5.2 No Game Logic Changes
- [ ] Confirm no modifications to:
  - `chips` store
  - `cps` store
  - building logic
  - upgrade logic
  - multiplier logic
- [ ] Confirm no new state variables added

**Acceptance Criteria**
- Odometer is purely a display layer
- Game logic untouched

### 5.3 Visual Validation
- [ ] Test readability at all scales
- [ ] Test Escape & Relocate behavior
- [ ] Test suffix transitions (K/M/B/T)

**Acceptance Criteria**
- Always readable
- Always deterministic
- Always stable

## Scope Guardrails (Foolproofing)

**This feature must not introduce:**
- new buildings
- new upgrades
- new multipliers
- new bonuses
- new economy systems
- new stores
- new game logic

**This feature must not modify:**
- chip generation
- CPS calculation
- building logic
- upgrade logic
- multiplier logic

**This feature must only modify:**
- UI components
- animation logic
- digit rendering