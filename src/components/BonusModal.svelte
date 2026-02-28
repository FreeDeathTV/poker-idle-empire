<script lang="ts">
  import { get } from 'svelte/store';
  import { bonusVisible, selectedHole, bonusBet, bonusResult, chips, adState, thUnlocked, formatNumber } from '$lib/stores';
  import { closeBonus, toggleCardSelection, randomizeHoleCards, playBonus, setBetAmount } from '$lib/gameLogic';
  import { getCardDisplay, getHandNotation, getStartingMultiplier, getWinProbability } from '$lib/poker';
  import { fly, fade, scale } from 'svelte/transition';
  import Instructions from './Instructions.svelte';
  import CardSelectorOptimized from './CardSelectorOptimized.svelte';
  
  // Card selection state - use stores directly
  $: canPlay = $selectedHole.length === 2 && $bonusBet >= 1000 && $chips >= $bonusBet;
  
  // Calculate multiplier directly from store values
  function calcMultiplier(hole: string[]): number {
    if (hole.length !== 2) return 1;
    const notation = getHandNotation(hole);
    return getStartingMultiplier(notation);
  }
  $: currentMultiplier = calcMultiplier($selectedHole);
  
  // Get selected cards display
  function getCardDisplayInfo(card: string) {
    const display = getCardDisplay(card);
    return {
      ...display,
      class: display.isRed ? 'text-red-500' : 'text-black'
    };
  }

  // Handle bet slider change
  function handleBetChange(e: Event) {
    const target = e.target as HTMLInputElement;
    setBetAmount(parseInt(target.value));
  }

  // Preset bet amounts
  const betPresets = [1000, 5000, 10000, 50000, 100000];

  // Format card for display
  function formatCard(card: string) {
    const display = getCardDisplay(card);
    return { rank: display.rank, suit: display.suit, isRed: display.isRed };
  }

  // Derived board card displays for results screen
  $: turnCard = $bonusResult ? $bonusResult.board?.[3] : null;
  $: turnDisplay = turnCard ? formatCard(turnCard) : null;
  $: riverCard = $bonusResult ? $bonusResult.board?.[4] : null;
  $: riverDisplay = riverCard ? formatCard(riverCard) : null;

  // Key results to trigger transitions on replay
  $: resultKey = $bonusResult 
    ? ($bonusResult.playerHole?.join('') || '') + 
      ($bonusResult.opponentHole?.join('') || '') + 
      ($bonusResult.board?.join('') || '')
    : 'none';

  let showInstructions = false;
</script>

{#if $bonusVisible}
  <div class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 overflow-y-auto">
    <div class="bg-gray-800 rounded-xl p-4 max-w-lg w-full border-2 border-yellow-500 max-h-[95vh] overflow-y-auto">
      
      {#if $bonusResult}
        <!-- RESULTS SCREEN -->
        {#key resultKey}
        <div class="text-center" in:fade={{ duration: 150 }} out:fade={{ duration: 120 }}>
          <h2 class="text-2xl font-bold mb-4 {$bonusResult.playerWins ? 'text-green-400' : 'text-red-400'}">
            {$bonusResult.playerWins ? '🎉 YOU WIN! 🎉' : '😢 YOU LOSE 😢'}
          </h2>
          
          <!-- Payout -->
          <div class="mb-6">
            <div class="text-4xl font-bold text-yellow-400" in:scale={{ duration: 180, start: 0.9 }}>+{formatNumber($bonusResult.payout)}</div>
            <div class="text-gray-400 text-sm">chips</div>
          </div>

          <!-- Hand results -->
          <div class="bg-gray-900 rounded-lg p-4 mb-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col items-center">
                <div class="text-gray-400 text-sm mb-2">Your Hand</div>
                <div class="flex justify-center gap-3 mb-2">
                  {#each $bonusResult.playerHole as card, i}
                    {@const c = formatCard(card)}
                    <div class="lux-card" in:fly={{ y: -20, duration: 220, delay: 100 * i }}>
                      <div class="lux-rank {c.isRed ? 'text-red-600' : 'text-black'}">{c.rank}</div>
                      <div class="lux-suit {c.isRed ? 'text-red-600' : 'text-black'}">{c.suit}</div>
                    </div>
                  {/each}
                </div>
                <div class="text-yellow-400 font-semibold">{$bonusResult.playerHand}</div>
              </div>
              <div class="flex flex-col items-center">
                <div class="text-gray-400 text-sm mb-2">Opponent</div>
                <div class="flex justify-center gap-3 mb-2">
                  {#each $bonusResult.opponentHole as card, i}
                    {@const c = formatCard(card)}
                    <div class="lux-card" in:fly={{ y: -20, duration: 220, delay: 100 * i + 120 }}>
                      <div class="lux-rank {c.isRed ? 'text-red-600' : 'text-black'}">{c.rank}</div>
                      <div class="lux-suit {c.isRed ? 'text-red-600' : 'text-black'}">{c.suit}</div>
                    </div>
                  {/each}
                </div>
                <div class="text-gray-300 font-semibold">{$bonusResult.opponentHand}</div>
              </div>
            </div>
          </div>

          <!-- Board -->
          <div class="mb-4">
            <div class="text-gray-400 text-sm mb-2">Board</div>
            <div class="flex justify-center items-center gap-4">
              <div class="flex gap-3">
                {#each $bonusResult.board.slice(0,3) as card, i}
                  {@const c = formatCard(card)}
                  <div class="lux-card sm" in:fly={{ y: -18, duration: 200, delay: 320 + i * 120 }}>
                    <div class="lux-rank {c.isRed ? 'text-red-600' : 'text-black'}">{c.rank}</div>
                    <div class="lux-suit {c.isRed ? 'text-red-600' : 'text-black'}">{c.suit}</div>
                  </div>
                {/each}
              </div>
              <div class="flex gap-3">
                {#if turnDisplay}
                  <div class="lux-card sm" in:fly={{ y: -18, duration: 200, delay: 700 }}>
                    <div class="lux-rank {turnDisplay.isRed ? 'text-red-600' : 'text-black'}">{turnDisplay.rank}</div>
                    <div class="lux-suit {turnDisplay.isRed ? 'text-red-600' : 'text-black'}">{turnDisplay.suit}</div>
                  </div>
                {/if}
              </div>
              <div class="flex gap-3">
                {#if riverDisplay}
                  <div class="lux-card sm" in:fly={{ y: -18, duration: 200, delay: 900 }}>
                    <div class="lux-rank {riverDisplay.isRed ? 'text-red-600' : 'text-black'}">{riverDisplay.rank}</div>
                    <div class="lux-suit {riverDisplay.isRed ? 'text-red-600' : 'text-black'}">{riverDisplay.suit}</div>
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <!-- Multiplier info -->
          <div class="text-sm text-gray-400 mb-4">
            Bet: {$bonusResult.bet.toLocaleString()} × Multiplier: {$bonusResult.multiplier.toFixed(1)}x
          </div>

          <!-- Adjust bet size for next hand -->
          <div class="mb-4">
            <div class="text-gray-400 text-sm mb-2">Adjust Bet for Next Hand</div>
            <div class="text-center text-2xl font-bold text-yellow-400 mb-2">
              {$bonusBet.toLocaleString()}
            </div>
            <input 
              type="range" 
              min="1000" 
              max={Math.min($chips, 1000000)} 
              step="1000"
              value={$bonusBet}
              on:input={handleBetChange}
              class="w-full mb-2"
            />
            <div class="flex gap-1 flex-wrap">
              {#each betPresets as preset}
                <button 
                  on:click={() => setBetAmount(preset)}
                  class="flex-1 py-1 px-2 text-xs rounded {$bonusBet === preset ? 'bg-yellow-600' : 'bg-gray-600'} hover:bg-gray-500"
                >
                  {preset >= 1000 ? (preset/1000) + 'K' : preset}
                </button>
              {/each}
            </div>
          </div>

          <button 
            on:click={playBonus}
            disabled={!canPlay}
            class="w-full py-3 px-4 mb-2 rounded-lg font-bold text-lg {canPlay ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
          >
            Play Again ({$bonusBet.toLocaleString()})
          </button>

          <button 
            on:click={closeBonus}
            class="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-bold"
          >
            Continue
          </button>
        </div>
        {/key}

      {:else}
        <!-- CARD SELECTION SCREEN -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-white">Texas Hold'em Bonus</h2>
          <div class="flex items-center gap-2">
            <button
              class="text-yellow-400 bg-gray-700 border border-yellow-600 rounded-full w-8 h-8 flex items-center justify-center text-base"
              on:click={() => (showInstructions = true)}
              aria-label="How to play"
              title="How to play"
            >?</button>
            <button on:click={closeBonus} class="text-gray-400 hover:text-white text-2xl">✕</button>
          </div>
        </div>

        <!-- Your hole cards -->
        <div class="mb-4">
          <div class="text-gray-400 text-sm mb-2">Your Hole Cards (select 2)</div>
          <div class="flex gap-2 justify-center mb-2">
            {#if $selectedHole.length === 0}
              <div class="w-16 h-24 bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-500">
                ?
              </div>
              <div class="w-16 h-24 bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-500">
                ?
              </div>
            {:else}
              {#each $selectedHole as card}
                {@const c = formatCard(card)}
                <button
                  type="button"
                  class="w-16 h-24 bg-white rounded-lg flex flex-col items-center justify-center {c.isRed ? 'text-red-600' : 'text-black'} cursor-pointer"
                  on:click={() => toggleCardSelection(card)}
                >
                  <span class="text-2xl font-bold">{c.rank}</span>
                  <span class="text-2xl">{c.suit}</span>
                </button>
              {/each}
            {/if}
          </div>
          
          {#if $selectedHole.length === 2}
            <div class="text-center text-sm">
              <span class="text-gray-400">Hand: </span>
              <span class="text-yellow-400 font-bold">{getHandNotation($selectedHole)}</span>
              <span class="text-green-400 ml-2">×{currentMultiplier.toFixed(2)}</span>
              <span class="text-gray-400 ml-2">({Math.round(getWinProbability(getHandNotation($selectedHole)) * 100)}% win)</span>
            </div>
          {/if}

          <button 
            on:click={randomizeHoleCards}
            class="w-full mt-2 py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm"
          >
            🎲 Random Hole Cards
          </button>
        </div>

        <!-- Bet amount -->
        <div class="mb-4">
          <div class="text-gray-400 text-sm mb-2">Bet Amount</div>
          <div class="text-center text-2xl font-bold text-yellow-400 mb-2">
            {$bonusBet.toLocaleString()}
          </div>
          
          <!-- Bet slider -->
          <input 
            type="range" 
            min="1000" 
            max={Math.min($chips, 1000000)} 
            step="1000"
            value={$bonusBet}
            on:input={handleBetChange}
            class="w-full mb-2"
          />
          
          <!-- Preset buttons -->
          <div class="flex gap-1 flex-wrap">
            {#each betPresets as preset}
              <button 
                on:click={() => setBetAmount(preset)}
                class="flex-1 py-1 px-2 text-xs rounded {$bonusBet === preset ? 'bg-yellow-600' : 'bg-gray-600'} hover:bg-gray-500"
              >
                {preset >= 1000 ? (preset/1000) + 'K' : preset}
              </button>
            {/each}
          </div>
        </div>

        <!-- Your chips -->
        <div class="text-center text-gray-400 text-sm mb-4">
          Your chips: <span class="text-yellow-400">{formatNumber($chips)}</span>
        </div>

        <!-- Play button -->
        <button 
          on:click={playBonus}
          disabled={!canPlay}
          class="w-full py-3 px-4 rounded-lg font-bold text-lg {canPlay ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
        >
          {#if $selectedHole.length < 2}
            Select 2 cards
          {:else if $chips < $bonusBet}
            Not enough chips
          {:else}
            Play Hand ({formatNumber($bonusBet)})
          {/if}
        </button>

        <!-- Card picker - optimized two-tier selector -->
        <div class="mt-4">
          <div class="text-gray-400 text-sm mb-3">Pick cards from deck</div>
          <CardSelectorOptimized />
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if showInstructions}
  <Instructions on:close={() => (showInstructions = false)} />
{/if}

<style>
  .lux-card {
    width: 64px;
    height: 96px;
    border-radius: 10px;
    background: radial-gradient(circle at 30% 20%, #ffffff 0%, #f7f7f7 40%, #e9e9e9 100%);
    box-shadow: 0 10px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6);
    border: 2px solid rgba(212, 175, 55, 0.8);
    display: grid;
    place-items: center;
    position: relative;
  }
  .lux-card.sm {
    width: 52px;
    height: 78px;
  }
  .lux-rank {
    font-weight: 800;
    font-size: 1.6rem;
    line-height: 1;
  }
  .lux-card.sm .lux-rank {
    font-size: 1.3rem;
  }
  .lux-suit {
    font-size: 1.2rem;
    line-height: 1;
    opacity: 0.9;
  }
  .lux-card.sm .lux-suit {
    font-size: 1rem;
  }
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    background: #4b5563;
    border-radius: 4px;
    outline: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #eab308;
    border-radius: 50%;
    cursor: pointer;
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #eab308;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
</style>
