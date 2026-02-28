<script lang="ts">
  import { selectedHole } from '$lib/stores';
  import { toggleCardSelection } from '$lib/gameLogic';

  let activeSuit: 'spades' | 'hearts' | 'diamonds' | 'clubs' | null = null;

  const aces = [
    { code: 's', suit: 'Spades', symbol: '♠', color: 'black' },
    { code: 'h', suit: 'Hearts', symbol: '♥', color: 'red' },
    { code: 'd', suit: 'Diamonds', symbol: '♦', color: 'red' },
    { code: 'c', suit: 'Clubs', symbol: '♣', color: 'black' }
  ];

  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

  function isDisabled(rank: string, suitCode: string): boolean {
    if ($selectedHole.length < 1) return false;
    const firstCard = $selectedHole[0];
    return firstCard === rank + suitCode;
  }

  function handleRankClick(rank: string, suitCode: string) {
    const cardCode = rank + suitCode;
    if (!isDisabled(rank, suitCode)) {
      toggleCardSelection(cardCode);
    }
  }

  function toggleAceSuit(suitName: string) {
    const suitLower = suitName.toLowerCase();
    if (activeSuit === suitLower) {
      activeSuit = null;
    } else {
      activeSuit = suitLower as 'spades' | 'hearts' | 'diamonds' | 'clubs';
    }
  }

  function handleAceClick(ace: { code: string; suit: string }) {
    // Only activate the suit for selection, don't select the Ace
    const suitLower = ace.suit.toLowerCase();
    if (activeSuit === suitLower) {
      activeSuit = null;
    } else {
      activeSuit = suitLower as 'spades' | 'hearts' | 'diamonds' | 'clubs';
    }
  }

  function resetSuitPicker() {
    if ($selectedHole.length === 2) {
      activeSuit = null;
    }
  }

  function getAceCardClass(ace: { code: string; color: string }): string {
    const isActive = activeSuit === ace.suit.toLowerCase();
    const isSelected = $selectedHole.includes('A' + ace.code);
    const baseClass = 'relative w-20 h-28 rounded-lg font-bold transition-all duration-200 flex flex-col items-center justify-center cursor-pointer border-2';
    const textColor = ace.color === 'red' ? 'text-red-600' : 'text-black';
    
    if (isSelected) {
      return `${baseClass} bg-yellow-400 border-yellow-500 shadow-lg shadow-yellow-400/50 ${textColor} font-black`;
    } else if (isActive) {
      return `${baseClass} bg-white border-yellow-400 shadow-lg shadow-yellow-400/50 ${textColor}`;
    }
    
    return `${baseClass} bg-white border-gray-400 hover:border-gray-300 hover:shadow-md ${textColor}`;
  }

  $: if ($selectedHole.length === 2) resetSuitPicker();
</script>

<!-- Ace card selector tier -->
  <div class="flex gap-3 mb-6 justify-between px-1">
  {#each aces as ace}
    <button
      class={getAceCardClass(ace)}
      on:click={() => handleAceClick(ace)}
      aria-label={`Ace of ${ace.suit}`}
    >
      <!-- Ace card design -->
      <div class="text-2xl font-black">{ace.symbol}</div>
      <div class="text-lg font-black">A</div>
    </button>
  {/each}
</div>

<!-- Rank cards tier (2-A) - Conditional display -->
{#if activeSuit}
  {@const suitAce = aces.find(a => a.suit.toLowerCase() === activeSuit)}
  {@const suitCode = suitAce?.code}
  {@const suitSymbol = suitAce?.symbol}
  {@const textColor = suitCode === 'h' || suitCode === 'd' ? 'text-red-600' : 'text-black'}
  
  <div class="mb-4">
    <div class="grid gap-1" style="grid-template-columns: repeat(13, minmax(0, 1fr));">
      {#each ranks as rank}
        {@const card = rank + suitCode}
        {@const disabled = isDisabled(rank, suitCode)}
        {@const isSelected = $selectedHole.includes(card)}
        <button
          class={`h-16 rounded font-bold transition-all duration-150 flex flex-col items-center justify-center text-sm border-2
            ${disabled 
              ? 'opacity-30 cursor-not-allowed bg-gray-400 border-gray-500 text-gray-600' 
              : isSelected 
                ? `bg-yellow-400 border-yellow-500 ${textColor} shadow-md font-black hover:bg-yellow-300` 
                : `bg-white border-gray-300 ${textColor} hover:bg-gray-50 hover:shadow-sm`}`}
          on:click={() => !disabled && handleRankClick(rank, suitCode)}
          disabled={disabled}
        >
          <div class="text-base font-black">{rank}</div>
          <div class="text-sm">{suitSymbol}</div>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  /* Grid styles */
</style>