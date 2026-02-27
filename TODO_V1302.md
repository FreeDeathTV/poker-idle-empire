# V1302 Implementation TODO

## New Files
- [x] Create src/routes/shop/+page.svelte (shop page)
- [x] Create src/routes/shop/+page.ts (load function)

## Modified Files
- [x] src/routes/+page.svelte - Already a dispatcher (no changes needed)
- [x] src/routes/app/+page.svelte - Already has Ace Token pill → /shop (no changes needed)
- [x] src/routes/game/+page.svelte - Now proper demo entry point with demo mode, Ace Token pill → /shop?demo=1
- [x] src/components/AceTokenHub.svelte - Already navigates to /shop (no changes needed)
- [x] src/components/EnterGameCTA.svelte - Already navigates to /game (no changes needed)

## Verification
- [x] / redirects correctly (has save → /app, no save → /landing)
- [x] /landing → /game works (EnterGameCTA → /game)
- [x] Ace Token pill works in /app (goto('/shop'))
- [x] Ace Token pill works in /game (goto('/shop?demo=1'))
- [x] /shop works in demo and full (shows locked in demo, full in full game)
- [x] No duplicate game pages remain (game UI is only in /app and /game)
- [x] No game UI exists in / (it's a dispatcher only)

## Implementation Complete
All V1302 routing behavior has been implemented according to the specification.
