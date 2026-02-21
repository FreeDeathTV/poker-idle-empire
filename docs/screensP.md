\### Screen Lock-In for V1: 1 Persistent Main Screen + 2 Modal Overlays

Yes, mate — screens are critical for that addictive "just one more tap" feel in idle games, and getting V1 right will hook test users hard enough to beg for V2 expansions (more buildings, prestige, etc.). We'll lock in \*\*exactly 3 effective screens\*\* as discussed: one always-visible main view + two temporary modal overlays. This keeps navigation zero-friction while allowing room for polish to make it feel premium and casino-like.

No changes to scope — everything below sticks religiously to ARCHITECTURE.md section 2 (must-haves only). We're enhancing \*quality and feel\* through visuals, micro-interactions, and mobile optimizations, not adding features. This will make test users think "This core loop is slick; imagine with more stuff!" — perfect setup for V2 hype.

\#### 1. Main Game Screen (The "Always-On" Hub — 90% of User Time)

This is the heart: A single, scrollable (if needed) vertical layout that loads instantly and shows progress at a glance. No tabs or side menus — everything glanceable for multitasking.

\*\*Layout & Flow (Phone Portrait Priority):\*\*

\- \*\*Header (Fixed/Sticky Top)\*\*: Big, glowing chip counter (e.g., "1,234,567 Chips" in gold font, animates on increase). Below it: CPS ticker ("+42/s") with subtle pulse.

\- \*\*Central Action Zone\*\*: Huge "Tap to Deal" button (full-width, tall for easy thumbs, green felt background with card icons). Taps trigger instant feedback (chip burst animation, +X popup text flying up).

\- \*\*Buildings Section\*\*: Simple list (just Poker Tables for V1) — card-like UI showing count, CPS contribution, cost, and "Buy" button. Each looks like a mini poker table (green border, chip stack icon).

\- \*\*Ad Rewards Section\*\*: Three horizontal cards/buttons (e.g., "x2 Taps (5min)", "+1 Table", "Unlock Bonus") with cooldown timers (e.g., "Ready!" or "3h 42m left"). Disabled ones greyed with teaser text ("Watch ad to unlock big wins!").

\- \*\*Bonus Entry (Post-Unlock)\*\*: A flashy "Play Texas Hold'em Bonus" button at bottom (disabled until ad-watched, then pulses invitingly).

\*\*Quality & Feel Enhancements (Within V1 Freeze):\*\*

\- \*\*Visual Richness\*\*: Tailwind + casino theme — dark grey bg with green felt texture (subtle CSS gradient or pattern), gold borders/shadows on buttons, unicode card suits (♠️♥️♦️♣️) as icons. Use Svelte transitions for smooth section expands/collapses if scroll gets long.

\- \*\*Interactivity Polish\*\*:

\- Taps: Haptic feedback (\`navigator.vibrate(50)\` if supported) + subtle scale animation on button press.

\- Live Updates: Reactive stores make numbers tick up smoothly (no jank) — use derived stores for formatted numbers (e.g., "1.2M" shorthand).

\- Offline Welcome: On load, show a quick toast ("Earned 5,678 chips while away!") with fade-in.

\- \*\*Mobile Optimization\*\*: Max-width 480px centered (Tailwind \`max-w-md mx-auto\`), large fonts (text-xl+), fat touch targets (min 48x48px per WCAG). Test for fat-finger friendliness.

\- \*\*Engagement Hook\*\*: Subtle idle animations (e.g., faint chip sparkle on tables) to draw eyes back, making users want more variety (V2 bait).

This screen alone should feel like a mini-Vegas in your pocket — rich enough to idle-check repeatedly, but simple to scream "expand me!"

\#### 2. Texas Hold'em Bonus Modal (The "High-Stakes Excitement" Overlay)

Triggered from main screen button (post-unlock). Feels like entering a private poker room — immersive but quick to exit.

\*\*Layout & Flow:\*\*

\- \*\*Picker Phase\*\*: Full-screen modal with close button. Top: Instructions ("Pick 2 hole cards for multiplier — AA safe ×1, 72o gamble ×100"). Middle: Grid of 52 cards (4x13, touch-scrollable, unicode suits in red/black). Selected cards highlight green. Bottom: "Random" button + bet input (slider or buttons like "10%", "50%", "All In" — min 1000 chips) + "Play Hand" button.

\- \*\*Result Phase\*\*: After play, seamlessly transitions (no reload) to reveal: Board cards (horizontal row), your/opponent holes, hand ranks (e.g., "Your Flush beats Opp's Pair!"), multiplier, payout animation (chips raining down). "Close" button returns to main with updated chips.

\*\*Quality & Feel Enhancements:\*\*

\- \*\*Visual Richness\*\*: Card grid with realistic styling (rounded corners, shadows, suit colors). Use CSS grid for responsive sizing (smaller on phone, but tappable). Result reveal: Cards "flip" with Svelte transitions (subtle rotateY).

\- \*\*Interactivity Polish\*\*:

\- Card Taps: Instant highlight + vibration. Limit to 2 selections (auto-deselect if over).

\- Bet Slider: Smooth drag with live preview ("Bet: 5,000 → Potential Win: 1M").

\- Win/Loss Drama: Green/red flash on result, confetti particles (CSS only, no lib) for big wins to hype the "miracle 72o" moments.

\- \*\*Engagement Hook\*\*: Show hand notation + multiplier live as you pick (e.g., "72o = ×100 — feeling lucky?"). This teases the risk/reward, making users crave more variants (V2 bait like Omaha or tournaments).

This modal should feel thrilling and polished — like a pro poker app snippet — leaving users thinking "More games like this please!"

\#### 3. Ad Watch Modal (The "Quick Reward" Interstitial Overlay)

Short-lived (5s auto-close) — triggered from ad buttons on main. Feels like a mini-break with payoff.

\*\*Layout & Flow:\*\*

\- Full-screen dim overlay. Center: "Watching Ad..." title, reward reminder (e.g., "Unlocking Bonus Round!"), circular progress bar (fills over 5s), countdown timer ("5s left").

\*\*Quality & Feel Enhancements:\*\*

\- \*\*Visual Richness\*\*: Casino flair — gold progress bar with chip icons spinning around it. Subtle bg blur on main screen underneath.

\- \*\*Interactivity Polish\*\*: Smooth CSS animation for bar fill. Vibration at start/end. Auto-grant reward with success toast on close ("x2 Taps activated!").

\- \*\*Engagement Hook\*\*: Teaser text like "Thanks for watching — big wins await!" to build anticipation for the unlocked bonus.

This keeps it snappy but satisfying, reinforcing the progression without annoyance.

\### Implementation Notes for AI Coder (To Ensure Quality)

\- \*\*Tools/Libs Lock\*\*: Only Svelte built-ins for animations/transitions (no GSAP). Tailwind for all styling (custom casino colors in config).

\- \*\*Testing Focus\*\*: Emphasize real-phone tests (iOS/Android) for touch feel, load speed (<2s), offline behavior. Use Chrome emulation first.

\- \*\*Metrics for "Rich Feel"\*\*: Aim for 60fps smooth, accessible contrast (gold on dark), no layout shifts. Get feedback on "Does it feel premium?" from test users.

\- \*\*V2 Tease Strategy\*\*: In V1, add subtle placeholders (e.g., greyed "Coming Soon" section for future buildings) — but no functionality. This plants the seed without violating freeze.

With this lock-in, V1 will shine: Test users get a tight, polished loop that ends too soon, making them demand V2. No drift — if ideas pop up, file as V2 proposals per ARCHITECTURE.md.

Ready to hand this off to the AI coder for build? Or want wireframes/text sketches first?