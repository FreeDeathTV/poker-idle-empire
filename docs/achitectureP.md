\# ARCHITECTURE.md – Poker Idle Empire

\*\*Last updated:\*\* February 19, 2026

\*\*Version controlled:\*\* This file is the single source of truth for V1 architecture, scope, and non-negotiable boundaries.

Any proposed change that contradicts this document \*\*must\*\* target V2+.

\## 1. Project Purpose & Core Philosophy

\*\*One-sentence mission (V1 lock-in):\*\*

A minimalist, phone-first idle/tapper browser game where the player builds passive chip income via poker-themed buildings while occasionally tapping to accelerate growth, with a single high-risk/high-reward Texas Hold'em bonus mini-game unlocked via simulated ad-watches.

\*\*Design principles (non-negotiable for V1):\*\*

\- Phone-first UX (large touch targets, vertical layout, minimal scrolling)

\- Extremely low cognitive load — glanceable during real poker sessions

\- 100% client-side (no backend, no auth, no multiplayer)

\- Offline-first progression (timestamp-based earnings)

\- Maximum bundle size < 500 KB gzipped (aggressive goal)

\- No animations beyond subtle Svelte transitions (no heavy libs)

\- No sound by default (toggleable later)

\- Simulated ads only — no real ad SDKs in V1

\## 2. V1 Strict Scope – Feature Freeze

\*\*Anything not listed below is explicitly forbidden in V1.\*\*

No exceptions. No "small" additions. No nice-to-haves. No polish items unless they fix a bug that prevents playability.

\### Must-have functionality (the only things allowed to be implemented)

1\. \*\*Core Loop\*\*

\- Central chip counter (big number, updates live)

\- Single large "Tap to Deal" button → gives instant chips (base + small random bonus)

\- Tap rewards affected by temporary x2 multiplier (from ad watch)

2\. \*\*Idle Progression\*\*

\- One building type only: "Poker Table"

\- Cost starts at 10 chips, increases ~15% per purchase (classic exponential)

\- Each table gives fixed CPS (chips per second)

\- Passive CPS accumulation (updated every ~1s)

\- Offline earnings calculation on load (simple timestamp diff × CPS)

3\. \*\*Ad Reward System (simulated – no real ads)\*\*

\- Three reward types, each with independent 8-hour cooldown:

\- x2 tap multiplier for 5 minutes

\- Instant +1 Poker Table

\- Permanent unlock of Texas Hold'em bonus round

\- Fake 5-second "watching" animation/countdown when clicked

\- Cooldowns persist via localStorage (Date.now() based)

4\. \*\*Texas Hold'em Bonus Mini-Game (only available after unlock)\*\*

\- Modal with:

\- 52-card grid to manually pick exactly 2 hole cards (touch-friendly)

\- "Random Hole Cards" button

\- Bet slider or fixed % of chips (min 1000)

\- Starting hand multiplier:

\- AA = ×1 (safest)

\- 72o ≈ ×100 (riskiest)

\- Linear interpolation across 169 ranked starting hands

\- Simulate full Texas Hold'em hand:

\- Random opponent hole cards

\- Random 5-card board

\- Use pokersolver to evaluate and compare hands

\- Payout = bet × 2 × multiplier if player wins (ties = player wins)

\- Show result screen: board, opponent cards, hand descriptions, win/loss, payout

5\. \*\*Persistence\*\*

\- Save/load via localStorage (chips, buildings count, ad cooldowns, unlock flag, last save timestamp)

\- Auto-save on every major action + every 30 seconds

6\. \*\*UI / Layout\*\*

\- Single-page app (src/routes/+page.svelte)

\- Sections: header (chips + CPS), tap button, buildings list, ad buttons, bonus button (disabled until unlocked)

\- Dark casino theme (green felt bg, gold text/buttons)

\- Responsive: max-width ~480px centered (phone portrait primary)

\### Explicitly Forbidden in V1 (move to V2 wishlist)

\- Any additional building types

\- Upgrades / multipliers on buildings

\- Prestige / reset mechanic

\- Achievements / milestones

\- Sound effects / music

\- Animations beyond basic fade/scale

\- Multiple casino "floors" or themes

\- Deck customization / card collection

\- Leaderboards / sharing

\- Daily rewards / login streaks

\- More complex poker variants (Omaha, etc.)

\- Real ad integration (AdMob, etc.)

\- In-app purchases / monetization hooks

\- Tutorial / onboarding overlay

\- Settings menu (except maybe mute toggle in V2)

\- Any form of social features

\- Any currency besides chips

\- Any visual card representations beyond text (unicode suits ok, but no SVG deck art)

\## 3. Technical Architecture – Locked for V1

\- \*\*Framework\*\* SvelteKit 1.x (Svelte 4)

\- \*\*Language\*\* TypeScript (strict: true)

\- \*\*Styling\*\* Tailwind CSS v3 (mobile-first utilities only)

\- \*\*PWA\*\* vite-plugin-pwa (basic manifest + auto-update SW)

\- \*\*State\*\* Svelte writable/derived stores + localStorage

\- \*\*Poker engine\*\* pokersolver (only loaded when bonus unlocked)

\- \*\*Build target\*\* Static adapter v2 (@sveltejs/adapter-static)

\- \*\*Deployment\*\* Vercel / Netlify (static site)

\*\*No additional npm packages allowed in V1 except:\*\*

\- pokersolver

\- vite-plugin-pwa

\- tailwindcss + postcss + autoprefixer

\## 4. Decision Log – Why these boundaries?

\- Single building → easiest balancing, fastest to implement & test

\- One bonus mini-game → the only "fun" differentiated mechanic

\- Simulated ads → gives progression boost without legal/compliance complexity

\- No fancy visuals → keeps bundle tiny and load fast on mobile data

\- Strict scope → prevents 6-month never-finished prototype syndrome

\## 5. V2+ Feature Parking Lot

All other ideas go here. No discussion of implementation until V1 is playable and has been tested on at least 3 real phones.

\- More buildings (vault, shuffler, VIP lounge, slots…)

\- Prestige / ascension system

\- Card collection / deck modifiers

\- Sound & haptic feedback

\- Achievements & statistics screen

\- Multiple themes / visual upgrades

\- Daily login bonus

\- Export/import save

\- Better offline UX messaging

\- Capacitor wrap → Play Store / App Store

\- Analytics (post-launch learning)

\## 6. Enforcement Rule

\*\*Any pull request, issue, or verbal suggestion that attempts to add a feature or change listed as forbidden in section 2 MUST be rejected with the comment:\*\*

\> This change violates the V1 architecture freeze documented in ARCHITECTURE.md.

\> Please file it as a V2 proposal after V1 reaches playable state on real devices.

This rule protects the project from death-by-a-thousand-small-features.

\---

Signed: The Project Scope Dictator (you)

Date: 2026-02-19
