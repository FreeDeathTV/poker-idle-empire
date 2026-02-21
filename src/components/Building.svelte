<script lang="ts">
  import type { Building as B } from '$lib/stores';
  import { chips, formatNumber } from '$lib/stores';
  import { buyBuilding } from '$lib/gameLogic';
  import { scale } from 'svelte/transition';

  export let building: B;
  export let index: number;

  $: canAfford = $chips >= building.cost;

  function handleBuy() {
    buyBuilding(index);
  }

  $: displayCount = Math.min(building.count, 24);
  $: overflowCount = Math.max(0, building.count - displayCount);
  $: tierClass = building.count >= 200 ? 'tier-4' : building.count >= 100 ? 'tier-3' : building.count >= 50 ? 'tier-2' : building.count >= 10 ? 'tier-1' : '';
</script>

<div class="bg-gray-800 rounded-lg p-3 mb-2 border border-gray-700">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-xl">🃏</span>
      <div>
        <div class="font-semibold text-white">{building.name}</div>
        <div class="text-xs text-gray-400">+{building.cps} cps each</div>
      </div>
    </div>
    <div class="text-right">
      <div class="text-sm text-gray-400">Owned: <span class="text-white font-bold">{building.count}</span></div>
      <button
        on:click={handleBuy}
        disabled={!canAfford}
        class="mt-1 px-3 py-1.5 rounded text-sm font-semibold transition-colors {canAfford 
          ? 'bg-green-600 hover:bg-green-500 text-white' 
          : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
      >
        Buy {formatNumber(building.cost)} 🎰
      </button>
    </div>
  </div>

  <div class="mini-grid mt-3 {tierClass}">
    {#each Array(displayCount) as _, i (i)}
      <div class="mini-table" in:scale={{ duration: 160, start: 0.6 }} title="Table {i + 1}"></div>
    {/each}
    {#if overflowCount > 0}
      <div class="mini-badge glow">+{overflowCount}</div>
    {/if}
  </div>
</div>

<style>
  .mini-grid {
    display: grid;
    grid-template-columns: repeat(12, 14px);
    gap: 6px 8px;
    align-items: center;
  }
  .mini-table {
    width: 28px;
    height: 16px;
    border-radius: 9999px;
    background:
      radial-gradient(120% 80% at 50% 20%, rgba(255,255,255,.2) 0%, rgba(0,0,0,0) 60%),
      linear-gradient(160deg, #0b5a2a, #095223 60%, #083f1a);
    border: 2px solid rgba(212,175,55,.8);
    box-shadow: 0 1px 2px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3);
  }
  .mini-grid.tier-1 .mini-table { box-shadow: 0 1px 3px rgba(0,0,0,.45), 0 0 6px rgba(212,175,55,.25), inset 0 1px 0 rgba(255,255,255,.35); }
  .mini-grid.tier-2 .mini-table { box-shadow: 0 1px 3px rgba(0,0,0,.5), 0 0 10px rgba(212,175,55,.35), inset 0 1px 0 rgba(255,255,255,.38); }
  .mini-grid.tier-3 .mini-table { box-shadow: 0 1px 4px rgba(0,0,0,.55), 0 0 14px rgba(212,175,55,.45), inset 0 1px 0 rgba(255,255,255,.4); }
  .mini-grid.tier-4 .mini-table { box-shadow: 0 1px 5px rgba(0,0,0,.6), 0 0 18px rgba(212,175,55,.55), inset 0 1px 0 rgba(255,255,255,.42); }
  .mini-badge {
    padding: 0 6px;
    height: 18px;
    border-radius: 10px;
    background: linear-gradient(180deg,#ffd766,#e3a81b);
    color: #1b1303;
    font-weight: 800;
    font-size: 11px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #74521b;
    box-shadow: 0 1px 2px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.6);
  }
  .mini-badge.glow {
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,100% { filter: drop-shadow(0 0 0 rgba(212,175,55,.0)); }
    50% { filter: drop-shadow(0 0 6px rgba(212,175,55,.6)); }
  }
</style>
