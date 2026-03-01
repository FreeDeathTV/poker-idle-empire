<script lang="ts">
  import type { Building as B } from '$lib/stores';
  import { chips, formatNumber } from '$lib/stores';
  import { buyBuilding } from '$lib/gameLogic';
  import BuildingMeter from './BuildingMeter.svelte';

  export let building: B;
  export let index: number;

  $: canAfford = $chips >= building.cost;

  function handleBuy() {
    buyBuilding(index);
  }
</script>

<div class="building-card bg-gray-800/95 rounded-lg p-3 mb-2 border border-gray-600/60 shadow-lg transition-all duration-200 hover:border-yellow-500/40 hover:shadow-xl">
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2 min-w-0">
      <div class="font-semibold text-white truncate">{building.name}</div>
    </div>
    <div class="text-xs font-semibold text-green-300 whitespace-nowrap">
      +{building.cps} cps each
    </div>
  </div>

  <div class="mt-2 flex items-center justify-between gap-3">
    <div class="text-sm text-gray-300">
      Owned: <span class="text-white font-bold">{building.count}</span>
    </div>
    <button
      on:click={handleBuy}
      disabled={!canAfford}
      style="touch-action: manipulation;"
      class="px-3 py-1.5 rounded text-sm font-semibold transition-all duration-200 whitespace-nowrap {canAfford
        ? 'bg-gradient-to-b from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white shadow-md hover:shadow-xl'
        : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
    >
      Buy {formatNumber(building.cost)} 🎰
    </button>
  </div>

  <div class="mt-3">
    <BuildingMeter owned={building.count} icon="PokerTable" />
  </div>
</div>

<style>
  .building-card {
    backdrop-filter: blur(2px);
    box-shadow: 0 4px 20px rgba(245, 197, 66, 0.15);
    border: 1px solid rgba(245, 197, 66, 0.3);
  }
  
  .building-card:hover {
    box-shadow: 0 6px 24px rgba(245, 197, 66, 0.25);
    transform: translateY(-1px);
  }
</style>
