# V1200 Craps Rush Implementation TODO

## Tasks
- [x] 1. Create deterministic RNG helper (src/lib/crapsRng.ts)
- [x] 2. Create expansionDiscount.ts store (src/lib/expansionDiscount.ts)
- [x] 3. Create CrapsRush.svelte component (src/components/CrapsRush.svelte)
- [x] 4. Update stores.ts to export new store
- [x] 5. Update +page.svelte to add entry point and discount badge
- [x] 6. Implementation complete

## V1200 Requirements Summary
- State Machine: IDLE → BET_SELECT → ROLL → RESULT → PAYOUT → COOLDOWN → IDLE
- Bet Groups: HIGH (7,11) → +15min | MEDIUM (4,5,6,8,9,10) → +10min | LOW (not 2,3,12) → +5min
- Discount: Always 50%, duration stacks
- Daily Cap: 60 minutes max
- Cooldown: 3 minutes between plays
- Streak Breaker: After 3 wins, next round forced LOSE
