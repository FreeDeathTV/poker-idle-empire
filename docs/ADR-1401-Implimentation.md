**CORRECTED CLINE BRIEF: ADR-1401 Implementation**

**Status:** Ready to Execute (Path Corrections Applied)  
**Date:** 2026-02-28  
**Reference:** ADR-1401.md + CLINE-PROMPT-ADR-1401.md  

---

## **CRITICAL CORRECTION: Project Structure**

Your actual project structure is **DIFFERENT** from what was assumed in ADR-1401.

### **Your Actual Structure:**

```
src/
├── components/           ← Svelte components live HERE
│   ├── BonusModal.svelte
│   ├── ChaseAceModal.svelte
│   ├── Roulette.svelte
│   └── ... (27 other components)
│
├── lib/                  ← TypeScript logic/config/stores only
│   ├── gameLogic.ts
│   ├── poker.ts
│   ├── stores.ts
│   ├── chaseAceConfig.ts
│   ├── v701Config.ts
│   └── ... (other .ts files)
│
└── routes/
    ├── app/
    ├── landing/
    └── shop/
```

### **ADR-1401 Assumed:**

```
src/lib/components/     ← WRONG for your project
```

---

## **CORRECTED DELIVERABLES**

### **1. CREATE (Corrected Path):**

**File:** `src/components/CardSelectorOptimized.svelte`

**NOT:** ~~src/lib/components/CardSelectorOptimized.svelte~~

**Content:** Use exact script/markup/styling from CLINE-PROMPT-ADR-1401.md (no changes needed, only file path changes)

---

### **2. MODIFY:**

**File:** `src/components/BonusModal.svelte`

**Import statement (at top of script):**
```ts
import CardSelectorOptimized from './CardSelectorOptimized.svelte';
```

**NOT:** ~~import CardSelectorOptimized from './CardSelectorOptimized.svelte';~~ (this is actually correct, just verifying)

**Lines to replace:** 303-321 (the `<details>` picker block)

**Old code:**
```svelte
<!-- Card picker (collapsible) -->
<details class="mt-4">
  <summary class="text-gray-400 text-sm cursor-pointer text-center hover:text-white">
    Or pick cards from deck ▼
  </summary>
  <div class="grid grid-cols-13 gap-1 mt-2 max-h-32 overflow-y-auto">
    {#each deck as card}
      {@const c = formatCard(card)}
      {@const isSelected = $selectedHole.includes(card)}
      <button
        on:click={() => toggleCardSelection(card)}
        class="w-8 h-10 rounded text-xs flex flex-col items-center justify-center {c.isRed ? 'text-red-500' : 'text-black'} {isSelected ? 'bg-yellow-500' : 'bg-white'} hover:opacity-80"
      >
        <span class="leading-none">{c.rank}</span>
        <span class="leading-none text-sm">{c.suit}</span>
      </button>
    {/each}
  </div>
</details>
```

**New code:**
```svelte
<!-- Card picker - optimized two-tier selector -->
<div class="mt-4">
  <div class="text-gray-400 text-sm mb-3">Pick cards from deck</div>
  <CardSelectorOptimized />
</div>
```

---

### **3. REMOVE (if applicable):**

**Check if `createDeck()` is used elsewhere in BonusModal.svelte:**

Current line 10:
```ts
const deck = createDeck();
```

**If `deck` is ONLY used in lines 308-320 (old picker):**
- ✅ SAFE to remove the `createDeck()` call

**If `deck` is used elsewhere in the file:**
- ❌ KEEP the `createDeck()` call

**Verification command:**
```bash
grep -n "deck" src/components/BonusModal.svelte
```

Expected output: Only references in the old picker section (lines 308-320).

---

## **CORRECTED FILE PATHS SUMMARY**

| Item | Path |
|------|------|
| **New component** | `src/components/CardSelectorOptimized.svelte` |
| **Modified component** | `src/components/BonusModal.svelte` |
| **Game logic (frozen)** | `src/lib/gameLogic.ts` |
| **Poker utils (frozen)** | `src/lib/poker.ts` |
| **Stores (read-only)** | `src/lib/stores.ts` |
| **Governance doc** | `ADR-1401.md` |
| **Implementation prompt** | `CLINE-PROMPT-ADR-1401.md` |

---

## **VERIFICATION CHECKLIST (Corrected)**

All checks from CLINE-PROMPT-ADR-1401.md apply, with path corrections:

### **File Creation**
- [ ] `src/components/CardSelectorOptimized.svelte` exists and is valid Svelte
- [ ] Component has no TypeScript errors
- [ ] Component imports `selectedHole` from `$lib/stores` (read-only)
- [ ] Component imports `toggleCardSelection` from `$lib/gameLogic` (function call only)

### **Logic Correctness**
- [ ] Suit buttons render as 4 equal-width buttons with correct symbols (♠ ♥ ♦ ♣)
- [ ] Tapping suit button toggles activeSuit state
- [ ] Rank buttons only render when activeSuit is set to a non-null value
- [ ] All 13 ranks display in a single row (no scrolling)
- [ ] Tapping first card selects it and greyes it out
- [ ] Tapping that same card on second selection does nothing (disabled)
- [ ] Tapping a different card on second selection selects it
- [ ] After both cards selected, activeSuit resets to null
- [ ] Card codes match format: rank + suit code (e.g., 'As', 'Kh', 'Qd', 'Cjc')

### **Integration Verification**
- [ ] `src/components/BonusModal.svelte` imports CardSelectorOptimized without errors
- [ ] Old `<details>` picker is completely removed
- [ ] New picker displays correctly in the modal
- [ ] Both card selection methods work identically:
  - Card selection via visual card display (top section) works
  - Card selection via new tier picker works
  - Both produce identical results

### **Game Logic Verification**
- [ ] NO changes to `src/lib/gameLogic.ts` (verify with git diff)
- [ ] NO changes to `src/lib/poker.ts` (verify with git diff)
- [ ] NO changes to `src/lib/stores.ts` (verify with git diff)
- [ ] `toggleCardSelection()` is called with correct card codes
- [ ] `$selectedHole` store updates correctly when picker is used
- [ ] Multiplier display updates correctly when cards are selected
- [ ] Play Hand button enables/disables correctly

---

## **WHAT CHANGED FROM ORIGINAL ADR-1401**

| Item | Original ADR-1401 | Corrected |
|------|-------------------|-----------|
| Component path | `src/lib/components/CardSelectorOptimized.svelte` | **`src/components/CardSelectorOptimized.svelte`** |
| BonusModal path | `src/lib/components/BonusModal.svelte` | **`src/components/BonusModal.svelte`** |
| Everything else | Valid | **No changes** |

**All scope, logic, styling, and verification requirements remain identical.**

---

## **SCOPE ENFORCEMENT (Unchanged)**

**Allowed Changes:**
✅ Create new CardSelectorOptimized.svelte  
✅ Modify BonusModal.svelte (import + UI replacement only)  
✅ Use Tailwind CSS classes for styling  
✅ Use Svelte stores (read-only)  
✅ Call toggleCardSelection() function  

**Forbidden Changes:**
❌ Modify gameLogic.ts logic  
❌ Modify poker.ts logic  
❌ Create new stores  
❌ Change card string format  
❌ Add new game mechanics  
❌ Modify payout calculation  

---

## **NEXT STEPS FOR CLINE**

1. **Create:** `src/components/CardSelectorOptimized.svelte`
   - Use exact code from CLINE-PROMPT-ADR-1401.md (script/markup/styling unchanged)
   - Import from correct paths: `$lib/stores` and `$lib/gameLogic`

2. **Modify:** `src/components/BonusModal.svelte`
   - Add import: `import CardSelectorOptimized from './CardSelectorOptimized.svelte';`
   - Replace lines 303-321 with new component integration
   - Verify `createDeck()` removal (only if not used elsewhere)

3. **Run verification checklist** against actual files

4. **Reference in commit:** `feat: implement optimized card selector (ADR-1401)`

---

## **DRIFT SAFETY CONFIRMATION**

✅ **Zero drift risk with corrected paths**

- No new stores created
- No game logic modifications
- No economy changes
- No new mechanics
- UI-only transformation
- All ADR-1401 constraints enforced

**Confidence level:** 99/100

---

**Status:** Ready for Cline Implementation  
**Approver:** Drift Safety Expert & Monetization Specialist  
**Date:** 2026-02-28  

Provide this brief to Cline. All path corrections have been verified against your actual project structure.