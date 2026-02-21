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

<div class="building-card bg-gray-800 rounded-lg p-3 mb-2 border border-gray-700">
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
      class="px-3 py-1.5 rounded text-sm font-semibold transition-colors whitespace-nowrap {canAfford
        ? 'bg-green-600 hover:bg-green-500 text-white'
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
  }
</style>
