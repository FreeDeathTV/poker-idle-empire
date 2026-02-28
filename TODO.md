# **TODO.md — Heads‑Up Hold’em Ladder Mode (ADR‑1500 Series)**

This TODO file defines the **exact implementation sequence**, tied directly to the ADR‑1500 series.  
Each task must be completed **in order**, with **zero drift**, and checked off only when the corresponding ADR has been fully implemented and verified.

---

## **0. Foundation Rules (Must Follow Throughout)**

- All work must follow the **ADR‑1500 → ADR‑1504 specifications exactly**.  
- No deviation, improvisation, or undocumented changes.  
- Any change to behaviour, UI, or logic requires a **new ADR** before implementation.  
- All components must be **deterministic**, **client‑side**, and **modal‑contained**.  
- Reuse existing systems wherever possible.  
- No networking, no multiplayer, no server dependencies.

---

## **1. ADR‑1500 — Feature Definition & Architecture**
**Goal:** Establish the full scope and boundaries of the Heads‑Up Hold’em Ladder Mode.

- [x] Create feature folder structure inside Ace‑Token Shop  
- [x] Add modal entry point for “Heads‑Up Hold’em Ladder”  
- [x] Add placeholder portraits for all CPU opponents  
- [x] Add ladder ordering (TheNorm → AnyAceNick → RedTheRiot → CrazyHorse → MrMark)  
- [x] Add persistent save keys for ladder progress  
- [x] Add deterministic RNG seed for AI behaviour  

**Completion requirement:**  
Feature shell exists, modal opens, ladder list displays (locked/unlocked states not functional yet).

---

## **2. ADR‑1501 — Betting Engine & Blind Ladder**
**Goal:** Implement the deterministic heads‑up betting engine.

- [x] Implement hand state machine (preflop → flop → turn → river → showdown)  
- [x] Implement turn order logic (SB/BB rotation)  
- [x] Implement fold/call/check/raise/all‑in actions  
- [x] Implement pot management  
- [x] Implement stack tracking  
- [x] Implement blind posting  
- [x] Implement blind shrink ladder (10BB → 7.4BB → 5BB → 2.5BB → 1BB)  
- [x] Implement hand reset between rounds  
- [x] Implement game‑end detection  

**Completion requirement:**  
A full heads‑up hand can be played start‑to‑finish with no AI, using debug buttons.

---

## **3. ADR‑1502 — CPU AI Profiles & Behaviour System**
**Goal:** Implement the five CPU personalities with deterministic behaviour.

- [x] Implement AI attribute model (aggression, bluff, call, raise, threshold)  
- [x] Implement hand strength evaluation → 0–100 scale  
- [x] Implement decision engine (fold/call/raise/all‑in)  
- [x] Implement shallow‑stack logic (shove‑heavy at low BB)  
- [x] Implement seeded randomness  
- [x] Implement exploit flags for MrMark  
- [x] Implement CPU profiles:  
  - [x] TheNorm (Tier 1)  
  - [x] AnyAceNick (Tier 2)  
  - [x] RedTheRiot (Tier 3)  
  - [x] CrazyHorse (Tier 4)  
  - [x] MrMark (Tier 5)  

**Completion requirement:**  
CPU can play a full hand deterministically with distinct personalities.

---

## **4. ADR‑1503 — Progression Modal & Leaderboard**
**Goal:** Implement the ladder progression UI and local leaderboard.

### **Progression Modal**
- [x] Create modal layout (ladder list)  
- [x] Add portraits, bios, difficulty stars  
- [x] Add locked/unlocked states  
- [x] Add win progress bars (0/5 per CPU)  
- [x] Add “Next Opponent” highlight  
- [x] Add “Start Match” button (only if unlocked)  

### **Leaderboard**
- [x] Create local leaderboard data structure  
- [x] Add CPU “career stats” (deterministic fake values)  
- [x] Add player stats (tokens won, streaks, highest tier beaten)  
- [x] Add sorting (tokens → streak → tier)  
- [x] Add leaderboard modal  

**Completion requirement:**  
Player can view ladder progress and leaderboard independently of gameplay.

---

## **5. ADR‑1504 — Ace‑Token Economy Integration**
**Goal:** Integrate entry costs, rewards, streak bonuses, and progression gating.

### **Entry Costs**
- [x] Tier 1: 1 Ace‑Token  
- [x] Tier 2: 2 Ace‑Tokens  
- [x] Tier 3: 3 Ace‑Tokens  
- [x] Tier 4: 4 Ace‑Tokens  
- [x] Tier 5: 5 Ace‑Tokens  

### **Rewards**
- [x] Tier 1: +2 Ace‑Tokens  
- [x] Tier 2: +4 Ace‑Tokens  
- [x] Tier 3: +6 Ace‑Tokens  
- [x] Tier 4: +8 Ace‑Tokens  
- [x] Tier 5: +12 Ace‑Tokens  

### **Optional Chips**
- [x] Add chip rewards (configurable)  

### **Streak Bonuses**
- [x] +1 token every 3 wins  
- [x] +3 tokens every 5 wins  

### **Progression Gating**
- [x] Require 5 wins per CPU to unlock next tier  
- [x] Save progress deterministically  

**Completion requirement:**  
Player can spend tokens, win tokens, progress the ladder, and climb the leaderboard.

---

## **6. Final Integration & QA**
- [ ] Full modal flow test (Shop → Ladder → Match → Results → Ladder)  
- [ ] Verify deterministic behaviour (same seed = same actions)  
- [ ] Verify no drift from ADR‑1500 → 1504  
- [ ] Verify save/load stability  
- [ ] Verify UI responsiveness  
- [ ] Verify token economy balance  
- [ ] Verify CPU difficulty curve  
- [ ] Verify no infinite loops in betting engine  
- [ ] Verify blind ladder transitions  

**Completion requirement:**  
Feature is stable, deterministic, and matches all ADR specifications exactly.

---

## **7. Release Checklist**
- [ ] All ADR tasks checked off  
- [ ] All modals visually polished  
- [ ] All portraits replaced or confirmed  
- [ ] All economy values validated  
- [ ] All progression logic validated  
- [ ] All leaderboard entries validated  
- [ ] Final deterministic seed test  
- [ ] Merge into main branch