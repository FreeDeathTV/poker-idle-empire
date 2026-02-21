**Step 1: Create the Project**

**Run these in your terminal (assumes Node.js ≥18 installed). Use npm, but pnpm/yarn work too if preferred.**

**Bash**

**\# Create the SvelteKit project**

**npx sv create poker-idle-empire -- --template skeleton --types ts --no-add-ons**

**\# If sv is unavailable, fallback (non-interactive):**

**npx create-svelte@5.0.6 poker-idle-empire -- --template skeleton --types typescript --no-add-ons --no-install --no-dir-check**

**\# During prompts:**

**\# - Which Svelte app template? → Skeleton project**

**\# - Add type checking with TypeScript? → Yes, using TypeScript syntax**

**\# - Select additional options (use \[\] to select, <space> to toggle, <enter> to continue):**

**\# - None (we'll add our own later)**

**cd poker-idle-empire**

**\# Install core dependencies**

**npm install**

**\# Install our stack additions**

**npm install pokersolver # For poker hand evaluation in bonus round**

**npm install -D tailwindcss@3 postcss autoprefixer @sveltejs/adapter-static@^2 vite-plugin-pwa # Styling, static build, PWA**

**\# Initialize Tailwind**

**npx tailwindcss init -p # Or create the files manually as shown below**

**This creates a basic SvelteKit skeleton with TS support.**

**Step 2: Configure Key Files**

**Replace or create these files with the contents below. This enables:**

-   **Static adapter (for Vercel/Netlify deploys as a static site/PWA).**
-   **Tailwind integration (mobile-first classes).**
-   **PWA basics (manifest, service worker via vite-plugin-pwa).**
-   **TS config tweaks for strictness.**

**svelte.config.js**

**JavaScript**

**import adapter from '@sveltejs/adapter-static';**

**import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';**

**/\*\* @type {import('@sveltejs/kit').Config} \*/**

**const config = {**

**// Consult https://kit.svelte.dev/docs/integrations#preprocessors**

**// for more information about preprocessors**

**preprocess: vitePreprocess(),**

**kit: {**

**adapter: adapter({**

**// default options are shown. Adjust as needed for PWA/static**

**pages: 'build',**

**assets: 'build',**

**fallback: undefined,**

**precompress: false,**

**strict: true**

**}),**

**// PWA: Service worker registration handled by vite-plugin-pwa in vite.config.ts**

**}**

**};**

**export default config;**

**vite.config.ts**

**TypeScript**

**import { sveltekit } from '@sveltejs/kit/vite';**

**import { defineConfig } from 'vite';**

**import { VitePWA } from 'vite-plugin-pwa';**

**export default defineConfig({**

**plugins: \[**

**sveltekit(),**

**VitePWA({**

**registerType: 'autoUpdate',**

**devOptions: { enabled: true }, // Enable PWA in dev mode for testing**

**includeAssets: \['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'\], // Add icons later**

**manifest: {**

**name: 'Poker Idle Empire',**

**short\_name: 'IdlePoker',**

**description: 'Idle poker casino tycoon game for phone-first play',**

**theme\_color: '#0a0a0a', // Dark casino theme**

**icons: \[**

**{**

**src: 'pwa-192x192.png', // Placeholder: Generate real icons later**

**sizes: '192x192',**

**type: 'image/png'**

**},**

**{**

**src: 'pwa-512x512.png',**

**sizes: '512x512',**

**type: 'image/png'**

**}**

**\]**

**}**

**})**

**\]**

**});**

**tailwind.config.js**

**JavaScript**

**/\*\* @type {import('tailwindcss').Config} \*/**

**export default {**

**content: \['./src/\*\*/\*.{html,js,svelte,ts}'\],**

**theme: {**

**extend: {**

**colors: {**

**'casino-green': '#0a5c36', // Felt table green**

**'chip-gold': '#ffd700', // Gold accents**

**'card-red': '#ff0000', // Hearts/diamonds**

**'card-black': '#000000' // Clubs/spades**

**},**

**fontFamily: {**

**sans: \['Inter', 'sans-serif'\] // Clean, modern font for mobile**

**}**

**}**

**},**

**plugins: \[\]**

**};**

**postcss.config.js (Tailwind v3 plugin)**

**JavaScript**

**export default {**

**plugins: {**

**tailwindcss: {},**

**autoprefixer: {}**

**}**

**};**

**tsconfig.json (update for strict TS + paths)**

**Add "paths" for easier imports (e.g., $lib/stores).**

**JSON**

**{**

**"extends": "./.svelte-kit/tsconfig.json",**

**"compilerOptions": {**

**"strict": true,**

**"paths": {**

**"$lib": \["./src/lib"\],**

**"$lib/\*": \["./src/lib/\*"\]**

**}**

**},**

**"include": \["src/\*\*/\*.d.ts", "src/\*\*/\*.ts", "src/\*\*/\*.js", "src/\*\*/\*.svelte"\]**

**}**

**src/app.html (add Tailwind directives + basic meta for mobile/PWA)**

**HTML**

**<!doctype html>**

**<html lang="en">**

**<head>**

**<meta charset="utf-8" />**

**<link rel="icon" href="%sveltekit.assets%/favicon.png" />**

**<meta name="viewport" content="width=device-width, initial-scale=1" />**

**<!-- PWA meta -->**

**<meta name="theme-color" content="#0a0a0a" />**

**<link rel="manifest" href="/manifest.webmanifest" /> <!-- Served by vite-pwa in dev -->**

**%sveltekit.head%**

**</head>**

**<body data-sveltekit-preload-data="hover">**

**%sveltekit.body%**

**</body>**

**</html>**

**src/app.css (Tailwind base)**

**CSS**

**@tailwind base;**

**@tailwind components;**

**@tailwind utilities;**

**/\* Global casino theme \*/**

**body {**

**@apply bg-gray-900 text-yellow-400 font-sans;**

**}**

**/\* Touch-friendly buttons \*/**

**button {**

**@apply px-4 py-2 rounded-lg bg-casino-green text-white text-lg;**

**}**

**Step 3: Folder Structure & Skeleton Files**

**Create this structure manually (or let an AI coder do it). I've included placeholders/skeletons for key files based on our plan. This sets up for MVP: tapper, idle, ads, bonus.**

**text**

**poker-idle-empire/**

**├── src/**

**│ ├── lib/ # Utilities, stores, logic**

**│ │ ├── stores.ts # Svelte stores for state (chips, buildings, ads, etc.)**

**│ │ ├── gameLogic.ts # Core functions (dealHand, buyBuilding, ad rewards, offline calc)**

**│ │ └── poker.ts # Poker-specific logic (deck, hands, multipliers using pokersolver)**

**│ ├── components/ # Reusable Svelte components**

**│ │ ├── BonusModal.svelte # Texas Hold'em bonus picker modal**

**│ │ ├── AdWatcher.svelte # Simulated ad countdown modal**

**│ │ └── Building.svelte # Reusable building card (for tables, etc.)**

**│ ├── routes/ # SvelteKit pages**

**│ │ └── +page.svelte # Main game page (app root)**

**│ ├── app.html # (configured above)**

**│ ├── app.css # (configured above)**

**│ └── vite-env.d.ts # (auto-generated)**

**├── static/ # Assets**

**│ └── favicon.png # Placeholder; add icons here**

**├── docs/ # Internal docs**

**│ └── setup.md # Detailed notes (draft below)**

**├── .gitignore # Standard SvelteKit + add node\_modules, build, etc.**

**├── package.json # (auto-generated + our deps)**

**├── svelte.config.js # (configured above)**

**├── tsconfig.json # (configured above)**

**├── tailwind.config.js # (configured above)**

**├── postcss.config.js # (configured above)**

**├── vite.config.ts # (configured above)**

**├── README.md # (from previous message)**

**└── LICENSE # Add MIT license text**

**Skeleton: src/lib/stores.ts**

**TypeScript**

**import { writable } from 'svelte/store';**

**export const chips = writable(0);**

**export const cps = writable(0); // Chips per second**

**export interface Building {**

**name: string;**

**count: number;**

**cost: number;**

**cps: number;**

**}**

**export const buildings = writable<Building\[\]>(\[**

**{ name: 'Poker Table', count: 0, cost: 10, cps: 1 }**

**// Add more later**

**\]);**

**// Ad system**

**export type AdType = 'doubleTap' | 'extraTable' | 'unlockTH';**

**export interface AdItem {**

**available: boolean;**

**nextAvailable: number;**

**permanent?: boolean;**

**}**

**export const adState = writable<Record<AdType, AdItem>>({**

**doubleTap: { available: true, nextAvailable: 0 },**

**extraTable: { available: true, nextAvailable: 0 },**

**unlockTH: { available: true, nextAvailable: 0 }**

**});**

**export const thUnlocked = writable(false);**

**export const tapMultiplier = writable(1);**

**export const watchingAd = writable<'none' | AdType>('none');**

**// Bonus round**

**export const bonusVisible = writable(false);**

**export const selectedHole = writable<string\[\]>(\[\]);**

**export const bonusResult = writable<any>(null); // Expand type later**

**Skeleton: src/lib/gameLogic.ts**

**TypeScript**

**import { get } from 'svelte/store';**

**import { chips, cps, buildings, adState, thUnlocked, tapMultiplier, watchingAd } from './stores';**

**import type { AdType } from './stores';**

**// Constants**

**const EIGHT\_HOURS\_MS = 8 \* 60 \* 60 \* 1000;**

**const DOUBLE\_TAP\_DURATION\_MS = 5 \* 60 \* 1000;**

**// Offline progress (call on load)**

**export function calculateOfflineEarnings(lastTime: number) {**

**const now = Date.now();**

**const offlineTime = (now - lastTime) / 1000; // seconds**

**const earned = Math.floor(get(cps) \* offlineTime);**

**chips.update(n => n + earned);**

**// Update lastTime in localStorage**

**}**

**// Deal hand (basic tapper)**

**export function dealHand() {**

**const multi = get(tapMultiplier);**

**const base = 10 \* multi;**

**const bonus = Math.floor(Math.random() \* 50) + 1;**

**chips.update(n => n + base + bonus);**

**}**

**// Buy building**

**export function buyBuilding(index: number) {**

**// Logic from previous code**

**// ...**

**}**

**// Ad functions**

**export function checkAds() {**

**// Logic from previous**

**// ...**

**}**

**export function startAdWatch(type: AdType) {**

**// ...**

**}**

**export function grantAdReward(type: AdType) {**

**// ...**

**}**

**// Save/load (expand to include all stores)**

**export function saveGame() {**

**// ...**

**}**

**export function loadGame() {**

**// ...**

**calculateOfflineEarnings(/\* lastTime from storage \*/);**

**}**

**Skeleton: src/lib/poker.ts**

**TypeScript**

**import Hand from 'pokersolver'; // Note: pokersolver exports Hand**

**// Starting hands array (169 entries, AA best to 72o worst)**

**export const startingHands = \[ /\* Full array from previous message \*/ \];**

**// Functions: getHandNotation, getStartingMultiplier, createDeck, shuffleDeck, dealNCards, playBonusRound**

**// Copy from previous code snippets**

**Skeleton: src/components/BonusModal.svelte**

**svelte**

**<script lang="ts">**

**import { selectedHole, bonusVisible /\* etc. \*/ } from '$lib/stores';**

**// Logic from previous: toggleCard, randomHole, play**

**</script>**

**{#if $bonusVisible}**

**<div class="modal-overlay">**

**<!-- Full modal from previous -->**

**</div>**

**{/if}**

**<style>**

**/\* Tailwind classes: @apply fixed inset-0 bg-black/80 flex items-center justify-center z-50; \*/**

**</style>**

**Skeleton: src/components/AdWatcher.svelte**

**svelte**

**<script lang="ts">**

**import { watchingAd /\* etc. \*/ } from '$lib/stores';**

**// Countdown logic from previous**

**</script>**

**{#if $watchingAd !== 'none'}**

**<!-- Full from previous, with Tailwind -->**

**{/if}**

**Skeleton: src/components/Building.svelte**

**svelte**

**<script lang="ts">**

**export let building: Building;**

**export let index: number;**

**import { buyBuilding } from '$lib/gameLogic';**

**</script>**

**<div class="building-card">**

**<p>{building.name} ({building.count}) - Cost: {building.cost}</p>**

**<button on:click={() => buyBuilding(index)}>Buy</button>**

**</div>**

**<style>**

**.building-card { @apply bg-gray-800 p-4 rounded-lg mb-2; }**

**</style>**

**Skeleton: src/routes/+page.svelte (Main App)**

**svelte**

**<script lang="ts">**

**import { onMount } from 'svelte';**

**import { chips, cps, buildings, adState /\* etc. \*/ } from '$lib/stores';**

**import { loadGame, updateIdle, openBonus /\* etc. \*/ } from '$lib/gameLogic';**

**import BonusModal from '$lib/components/BonusModal.svelte';**

**import AdWatcher from '$lib/components/AdWatcher.svelte';**

**import Building from '$lib/components/Building.svelte';**

**onMount(() => {**

**loadGame();**

**const interval = setInterval(updateIdle, 1000);**

**return () => clearInterval(interval);**

**});**

**</script>**

**<main class="container mx-auto p-4 max-w-md"> <!-- Phone-first: max-w-md centers on larger screens -->**

**<h1 class="text-3xl font-bold mb-4">Poker Idle Empire</h1>**

**<p class="text-2xl">Chips: {$chips} | CPS: {$cps}</p>**

**<button class="w-full mb-4" on:click={dealHand}>👆 Tap to Deal!</button>**

**<section class="mb-4">**

**<h2 class="text-xl">Buildings</h2>**

**{#each $buildings as building, i}**

**<Building {building} index={i} />**

**{/each}**

**</section>**

**<section class="ads">**

**<!-- Ad buttons from previous -->**

**</section>**

**<BonusModal />**

**<AdWatcher />**

**</main>**

**Step 4: Git & Deploy Setup**

**Bash**

**git init**

**git add .**

**git commit -m "Initial bootstrap: SvelteKit + TS + Tailwind + PWA"**

**\# Optional: Push to GitHub**

**git remote add origin https://github.com/yourusername/poker-idle-empire.git**

**git push -u origin main**

**For deploy: npm run build → upload build/ to Vercel/Netlify (connect GitHub for auto-deploys).**

**Step 5: docs/setup.md Draft**

**Create this file with:**

**Markdown**

**\# Internal Setup Notes**

**\## Icons Generation**

**Use https://realfavicongenerator.net/ or PWA Builder. Place in static/ and update vite.config.ts manifest.**

**\## Offline Calc Details**

**In gameLogic.ts: On load, get lastSaveTime from localStorage, calc earnings, add to chips.**

**\## Poker Bonus Expansion**

**Use pokersolver for hand eval. Add vibrations: if ('vibrate' in navigator) navigator.vibrate(200);**

**\## Testing on Phone**

**npm run dev -- --host # Expose to network**

**Access via phone browser at http://your-local-ip:5173**

**\## AI Coder Handoff**

**Implement MVP in order: stores → gameLogic → components → main page integration.**

**Add unit tests in tests/ folder using Vitest (npm install -D vitest).**
