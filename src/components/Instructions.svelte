<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  const dispatch = createEventDispatcher();
  let dontShow = true;
  function close() {
    if (dontShow) {
      try {
        localStorage.setItem('poker_idle_instructions_seen', '1');
      } catch {}
    }
    dispatch('close');
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4" transition:fade>
  <div class="absolute inset-0 bg-black/80"></div>
  <div class="relative w-full max-w-md bg-gray-900 border-2 border-yellow-500 rounded-2xl p-6 text-white shadow-2xl" transition:scale>
    <h2 class="text-2xl font-extrabold text-center mb-4">How to Play</h2>
    <div class="space-y-3 text-sm text-gray-200">
      <div class="flex items-start gap-3">
        <div class="text-2xl">🃏</div>
        <div><span class="font-bold text-yellow-300">Tap DEAL</span> to earn chips quickly.</div>
      </div>
      <div class="flex items-start gap-3">
        <div class="text-2xl">🏢</div>
        <div>Buy <span class="font-bold text-yellow-300">Poker Tables</span> to increase chips per second.</div>
      </div>
      <div class="flex items-start gap-3">
        <div class="text-2xl">📺</div>
        <div>Watch ads for <span class="font-bold text-yellow-300">2× Tap</span>, a free table, or to unlock the bonus.</div>
      </div>
      <div class="flex items-start gap-3">
        <div class="text-2xl">🎰</div>
        <div>In the bonus, pick two cards. Win the hand to get <span class="font-bold text-yellow-300">bet × multiplier</span>.</div>
      </div>
      <div class="flex items-start gap-3">
        <div class="text-2xl">💤</div>
        <div>Earn while away. Collect <span class="font-bold text-yellow-300">offline chips</span> when you return.</div>
      </div>
    </div>
    <div class="mt-6 flex items-center justify-between">
      <label class="flex items-center gap-2 text-xs text-gray-300">
        <input type="checkbox" bind:checked={dontShow} class="accent-yellow-500" />
        Don't show again
      </label>
      <button on:click={close} class="py-2 px-4 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black font-bold">Got it</button>
    </div>
  </div>
  <div class="pointer-events-none absolute inset-0">
    <div class="animate-pulse absolute left-1/2 top-[28%] -translate-x-1/2 w-40 h-40 rounded-full bg-yellow-500/10 blur-2xl"></div>
  </div>
</div>

<style>
  :global(body) .accent-yellow-500 {
    accent-color: #eab308;
  }
</style>
