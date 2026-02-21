\# Poker Idle Empire

A lightweight, phone-first idle/tapper game where you build a virtual poker casino empire. Tap to deal hands for quick chips, upgrade poker tables for passive income, unlock a high-risk Texas Hold'em bonus round with massive multipliers, and speed things up with fake "ad watches" (cooldown-based rewards). Perfect for background play during real poker sessions.

Built as a progressive web app (PWA) for easy mobile access, offline progress, and eventual native wrapping.

\*\*\[Live Demo (coming soon)\]()\*\* · \*\*\[Roadmap\](#roadmap)\*\* · \*\*\[Contributing\](#contributing)\*\*

\## Screenshot / Gameplay Preview

<!-- Placeholder: Add GIF or screenshots here later -->

<!-- Example: !\[Gameplay screenshot\](docs/screenshot-main.png) -->

<!-- Or embed a short gameplay GIF -->

(Coming in V1 – big chip counter, tap button, building list, bonus modal preview)

\## Features (MVP – V1)

\- \*\*Core Tapper\*\*: Large touch-friendly "Deal Hand" button gives instant chips + small random bonus

\- \*\*Idle Progression\*\*: Buy/upgrade "Poker Tables" for automatic chips-per-second (CPS)

\- \*\*Offline Earnings\*\*: Calculates passive income based on time away (using localStorage timestamps)

\- \*\*Ad Reward System\*\* (simulated, no real ads):

\- Watch "ad" → x2 tap rewards for 5 minutes

\- Watch "ad" → Instant +1 poker table

\- Watch "ad" → Permanent unlock of Texas Hold'em bonus round (8-hour cooldown per reward)

\- \*\*Texas Hold'em Bonus\*\* (high-reward mini-game):

\- Pick your two hole cards (or random) for custom starting hand

\- Multiplier based on hand strength (AA = safe ×1, 72o = gamble ×100)

\- Simulate full hand vs random opponent → big payout if you win

\- \*\*PWA Ready\*\*: Installable on phone home screen, works offline, fast load

\## Tech Stack

\- \*\*Framework\*\*: \[SvelteKit\](https://kit.svelte.dev/) 1.x (Svelte 4)

\- \*\*Language\*\*: TypeScript (strict mode)

\- \*\*Styling\*\*: Tailwind CSS v3 (mobile-first utilities)

\- \*\*PWA\*\*: vite-plugin-pwa (manifest, service worker, offline support)

\- \*\*State\*\*: Svelte stores + localStorage / IndexedDB for saves

\- \*\*Poker Logic\*\*: pokersolver npm package (for accurate Texas Hold'em hand evaluation)

\- \*\*Build/Deploy\*\*: @sveltejs/adapter-static v2 → Vercel / Netlify (static)

\- \*\*Future\*\*: Capacitor for Android/iOS app-store builds (V3)

No backend, no auth — 100% client-side.

\## Getting Started

\### Prerequisites

\- Node.js ≥ 18

\- pnpm, yarn, or npm (pnpm recommended for speed)

\### Installation

\`\`\`bash

\# 1. Create the project (recommended)

npx sv create poker-idle-empire -- --template skeleton --types ts --no-add-ons
\# Fallback if sv is unavailable (non-interactive):
npx create-svelte@5.0.6 poker-idle-empire -- --template skeleton --types typescript --no-add-ons --no-install --no-dir-check

\# Choose: Skeleton project • Yes, TypeScript • No to other extras for minimal start

cd poker-idle-empire

\# 2. Install dependencies + our stack

npm install

npm install -D tailwindcss@3 postcss autoprefixer @sveltejs/adapter-static@^2 vite-plugin-pwa


\# 3. Install poker lib (for bonus round)

npm install pokersolver

\# 4. Run dev server

npm run dev -- --host

\# → http://localhost:5173 (open on phone via network IP too)
