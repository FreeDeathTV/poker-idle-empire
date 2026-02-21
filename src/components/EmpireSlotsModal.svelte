<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { chips, formatNumber, slotsMode, type SlotsMode } from '$lib/stores';
  import { saveGame } from '$lib/gameLogic';

  const dispatch = createEventDispatcher<{ close: void }>();

  const REEL_SYMBOLS = ['\u2660', '\u2665', '\u2666', '\u2663', '\u2B50', '7', 'BAR', 'Cherry'];
  const MULTIPLIER_TABLE: Array<{ multiplier: number; probability: number }> = [
    { multiplier: 2, probability: 0.7 },
    { multiplier: 3, probability: 0.2 },
    { multiplier: 4, probability: 0.07 },
    { multiplier: 5, probability: 0.025 },
    { multiplier: 10, probability: 0.005 }
  ];

  let reels = ['\u2660', '\u2665', '\u2666'];
  let isSpinning = false;
  let resultMultiplier: number | null = null;
  let resultText = 'Choose a mode and spin.';
  let netGain = 0;

  let reelInterval: ReturnType<typeof setInterval> | null = null;
  let reelTimeouts: Array<ReturnType<typeof setTimeout>> = [];

  function randomSymbol(): string {
    return REEL_SYMBOLS[Math.floor(Math.random() * REEL_SYMBOLS.length)];
  }

  function calculateWager(totalChips: number, mode: SlotsMode): number {
    if (totalChips < 2) return 0;
    if (mode === 'low') return 2;
    return Math.max(2, Math.floor(totalChips * 0.5));
  }

  function rollMultiplier(rand = Math.random()): number {
    let cumulative = 0;
    for (const entry of MULTIPLIER_TABLE) {
      cumulative += entry.probability;
      if (rand <= cumulative) return entry.multiplier;
    }
    return 10;
  }

  function clearSpinTimers() {
    if (reelInterval) {
      clearInterval(reelInterval);
      reelInterval = null;
    }
    for (const timeout of reelTimeouts) clearTimeout(timeout);
    reelTimeouts = [];
  }

  function setMode(mode: SlotsMode) {
    if (isSpinning) return;
    slotsMode.set(mode);
    saveGame();
  }

  function handleSpin() {
    if (isSpinning || $chips < 2) return;

    const currentChips = $chips;
    const wagerValue = calculateWager(currentChips, $slotsMode);
    if (wagerValue < 2 || currentChips < wagerValue) return;

    const multiplier = rollMultiplier();
    const payout = wagerValue * multiplier;

    // Flow step 1: deduct wager immediately.
    chips.set(currentChips - wagerValue);

    isSpinning = true;
    resultMultiplier = null;
    resultText = 'Spinning...';
    netGain = 0;

    clearSpinTimers();
    reelInterval = setInterval(() => {
      reels = [randomSymbol(), randomSymbol(), randomSymbol()];
    }, 85);

    reelTimeouts.push(setTimeout(() => {
      reels = [randomSymbol(), reels[1], reels[2]];
    }, 1000));

    reelTimeouts.push(setTimeout(() => {
      reels = [reels[0], randomSymbol(), reels[2]];
    }, 1150));

    reelTimeouts.push(setTimeout(() => {
      clearSpinTimers();
      reels = [reels[0], reels[1], randomSymbol()];

      // Flow step 2/3: apply payout after the reel animation.
      chips.update((n) => n + payout);

      netGain = payout - wagerValue;
      resultMultiplier = multiplier;
      resultText = `You hit ${multiplier}x! Net gain: +${formatNumber(netGain)} chips.`;
      isSpinning = false;
      saveGame();
    }, 1300));
  }

  function closeModal() {
    if (isSpinning) return;
    dispatch('close');
  }

  $: wager = calculateWager($chips, $slotsMode);
  $: keepAmount = Math.max(0, $chips - wager);
  $: canSpin = $chips >= 2 && !isSpinning;

  onDestroy(() => {
    clearSpinTimers();
  });
</script>

<div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
  <div class="w-full max-w-sm rounded-xl border-2 border-yellow-400 bg-gray-900 p-4 text-white shadow-2xl">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xl font-bold">Empire Slots &#x1F3B0;</h2>
      <button
        on:click={closeModal}
        class="w-9 h-9 rounded-md bg-gray-800 border border-gray-600 text-xl leading-none"
        style="touch-action: manipulation;"
        aria-label="Close Empire Slots"
      >
        x
      </button>
    </div>

    <div class="grid grid-cols-2 gap-2 mb-3">
      <button
        on:click={() => setMode('low')}
        class="py-2 px-3 rounded-lg text-sm font-bold border { $slotsMode === 'low'
          ? 'bg-yellow-500 text-black border-yellow-300'
          : 'bg-gray-800 text-gray-200 border-gray-600' }"
        style="touch-action: manipulation;"
      >
        Low Stakes (2 chips)
      </button>
      <button
        on:click={() => setMode('high')}
        class="py-2 px-3 rounded-lg text-sm font-bold border { $slotsMode === 'high'
          ? 'bg-yellow-500 text-black border-yellow-300'
          : 'bg-gray-800 text-gray-200 border-gray-600' }"
        style="touch-action: manipulation;"
      >
        High Stakes (50% chips)
      </button>
    </div>

    <div class="rounded-lg bg-gray-800 border border-gray-700 p-3 mb-3 text-sm">
      <div>
        You will risk:
        <span class="font-bold text-yellow-300">
          {$slotsMode === 'low' ? '2 chips' : `${formatNumber(wager)} chips`}
        </span>
      </div>
      <div class="mt-1">
        You will keep:
        <span class="font-bold text-green-300">{formatNumber(keepAmount)} chips</span>
      </div>
    </div>

    <div class="slots-reels mb-3">
      {#each reels as reel, i (i)}
        <div class="reel-cell">{reel}</div>
      {/each}
    </div>

    <button
      on:click={handleSpin}
      disabled={!canSpin}
      class="w-full py-3 rounded-lg text-lg font-black border-2 transition-colors {canSpin
        ? 'bg-gradient-to-b from-yellow-600 to-yellow-800 border-yellow-400 text-white'
        : 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'}"
      style="touch-action: manipulation;"
    >
      SPIN
    </button>

    {#if $chips < 2}
      <div class="mt-2 text-xs text-red-300 text-center">Need 2 chips to spin.</div>
    {/if}

    <div class="mt-3 rounded-lg border border-gray-700 bg-gray-800 p-3 min-h-[74px]">
      {#if resultMultiplier !== null}
        <div class="text-2xl font-black text-yellow-300 pop">{resultMultiplier}x</div>
      {/if}
      <div class="text-sm text-gray-200 mt-1">{resultText}</div>
    </div>
  </div>
</div>

<style>
  .slots-reels {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .reel-cell {
    height: 52px;
    border-radius: 10px;
    border: 1px solid #5f4a1f;
    background: linear-gradient(180deg, #fff5d2, #f3cb66);
    color: #2b1a02;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 800;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 2px 5px rgba(0, 0, 0, 0.35);
  }

  .pop {
    animation: slots-pop 180ms ease-out;
    text-shadow: 0 0 10px rgba(250, 215, 88, 0.55);
  }

  @keyframes slots-pop {
    0% { transform: scale(1); }
    45% { transform: scale(1.12); }
    100% { transform: scale(1); }
  }
</style>
