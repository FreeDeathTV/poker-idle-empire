# Ladder Mode Isolation - Implementation Plan

## Goal
Isolate the new ADR-1500 ladder mode from legacy bonus game without touching legacy code.

## Files to CREATE (New Ladder-Specific)

### Phase 1: Store & Engine
- [ ] `src/lib/ladderStore.ts` - Ladder state (CPU profiles ADR-1500, progression ADR-1503)
- [ ] `src/lib/ladderEngine.ts` - ADR-1501 betting engine (blind ladder 10BB→1BB)
- [ ] `src/lib/ladderAI.ts` - ADR-1502 AI (exact profile values)

### Phase 2: UI Components  
- [ ] `src/components/HeadsUpHoldemLadderGame.svelte` - New ADR-1501 compliant game UI

### Phase 3: Integration
- [ ] Update `src/components/HeadsUpHoldemLadder.svelte` - Use ladderStore, navigate to new game

## Legacy Files (DO NOT MODIFY)
- `src/components/HeadsUpHoldemGame.svelte`
- `src/lib/headsUpHoldemEngine.ts`
- `src/lib/headsUpHoldemStore.ts`  
- `src/lib/headsUpHoldemAI.ts`

## Key Specifications from ADR Documents

### ADR-1500: CPU Profiles
1. TheNorm — Tier 1 (Very Easy) - aggression: 10, bluff: 5, call: 90, raise: 5, threshold: 15
2. AnyAceNick — Tier 2 (Easy) - aggression: 25, bluff: 10, call: 75, raise: 20, threshold: 30
3. RedTheRiot — Tier 3 (Medium) - aggression: 50, bluff: 15, call: 40, raise: 45, threshold: 50
4. CrazyHorse — Tier 4 (Hard) - aggression: 85, bluff: 35, call: 30, raise: 80, threshold: 40
5. MrMark — Tier 5 (Very Hard) - aggression: 70, bluff: 25, call: 45, raise: 65, threshold: 60

### ADR-1501: Blind Ladder
- 10BB → 7.4BB → 5BB → 2.5BB → 1BB
- Both stacks reset to new BB value after each hand
- Game ends at 1BB or if a player reaches 0 chips

### Poker Game Flow (Texas Hold'em)
1. Deal hole cards (2 each)
2. Preflop betting (action starts with player facing BB)
3. Flop (3 community cards) - betting
4. Turn (4th community card) - betting
5. River (5th community card) - betting
6. Showdown - evaluate best 5-card hand
