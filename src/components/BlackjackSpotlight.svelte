<script lang="ts">
  import { blackjackState, REWARD_VALUES, calculateTotal, type BetTier, type Card } from '$lib/sponsorsBlackjack';
  import { aceTokens, formatNumber } from '$lib/stores';

  // Subscribe to the store properly using Svelte 4 syntax
  $: state = $blackjackState;
  
  // Derived values
  $: playerTotal = calculateTotal(state.playerHand);
  $: dealerTotal = calculateTotal(state.dealerHand);
  $: showDealerTotal = state.phase === 'PAYOUT' || state.phase === 'RESOLVE';
  $: expectedReward = state.result === 'WIN' 
    ? (state.isBlackjack ? Math.floor(REWARD_VALUES[state.betTier] * 1.5) : REWARD_VALUES[state.betTier])
    : 0;

  // Card display helpers
  function getCardDisplay(card: Card): string {
    return card.faceUp ? `${card.rank}${card.suit}` : '?';
  }
  
  function getCardColor(suit: string): string {
    if (suit === '♥' || suit === '♦') return 'text-red-500';
    return 'text-black';
  }

  // Bet tier selection
  function selectBetTier(tier: BetTier) {
    if (state.phase !== 'IDLE') return;
    blackjackState.setBetTier(tier);
  }

  // Game actions
  function deal() {
    blackjackState.deal();
  }

  function hit() {
    blackjackState.hit();
  }

  function stand() {
    blackjackState.stand();
  }

  function playAgain() {
    blackjackState.resetHand();
  }

  function closeModal() {
    blackjackState.closeGame();
  }

  // Get reward display text
  function getRewardText(): string {
    if (state.result !== 'WIN') return '';
    const base = REWARD_VALUES[state.betTier];
    if (state.isBlackjack) {
      return `+${Math.floor(base * 1.5)} Ace Tokens!`;
    }
    return `+${base} Ace Token${base > 1 ? 's' : ''}!`;
  }

  // Helper to get reward value for display
  function getTierReward(tier: string): number {
    return REWARD_VALUES[tier as BetTier];
  }

  // Typed bet tiers array for template
  const betTiers: BetTier[] = ['SMALL', 'MEDIUM', 'LARGE'];
</script>

{#if state.isOpen}
  <div class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-xl border-2 border-yellow-500 bg-gray-900 text-white shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-3 bg-gradient-to-b from-yellow-600 to-yellow-800 border-b border-yellow-400">
        <h2 class="text-lg font-bold text-white">Blackjack Spotlight</h2>
        <button
          class="w-8 h-8 rounded-md bg-black/30 border border-white/20 text-white text-xl leading-none hover:bg-black/40"
          on:click={closeModal}
          aria-label="Close Blackjack"
        >
          ×
        </button>
      </div>

      <!-- Game Area -->
      <div class="p-4 space-y-4">
        <!-- Dealer Hand -->
        <div class="text-center">
          <div class="text-sm text-gray-400 mb-2">Dealer's Hand</div>
          <div class="flex justify-center gap-2 flex-wrap">
            {#each state.dealerHand as card, i}
              <div 
                class="card-item"
                class:dealing={state.phase === 'DEAL'}
                style="animation-delay: {i * 150}ms"
              >
                {#if card.faceUp}
                  <div class="card-face card-front {getCardColor(card.suit)}">
                    <span class="card-rank">{card.rank}</span>
                    <span class="card-suit">{card.suit}</span>
                  </div>
                {:else}
                  <div class="card-face card-back">
                    <span class="card-pattern">♠</span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
          {#if showDealerTotal}
            <div class="mt-2 text-xl font-bold text-yellow-300">
              {dealerTotal}
            </div>
          {:else if state.dealerHand.length > 0}
            <div class="mt-2 text-xl font-bold text-gray-500">
              ?
            </div>
          {/if}
        </div>

        <!-- Result Banner -->
        {#if state.phase === 'PAYOUT' && state.result}
          <div class="result-banner {state.result.toLowerCase()}">
            {#if state.result === 'WIN'}
              <span class="result-text win">WIN!</span>
              {#if state.isBlackjack}
                <span class="result-sub">BLACKJACK!</span>
              {/if}
            {:else if state.result === 'LOSE'}
              <span class="result-text lose">LOSE</span>
            {:else}
              <span class="result-text push">PUSH</span>
            {/if}
          </div>
        {/if}

        <!-- Player Hand -->
        <div class="text-center">
          <div class="text-sm text-gray-400 mb-2">Your Hand</div>
          <div class="flex justify-center gap-2 flex-wrap">
            {#each state.playerHand as card, i}
              <div 
                class="card-item"
                class:dealing={state.phase === 'DEAL'}
                style="animation-delay: {(state.dealerHand.length + i) * 150}ms"
              >
                <div class="card-face card-front {getCardColor(card.suit)}">
                  <span class="card-rank">{card.rank}</span>
                  <span class="card-suit">{card.suit}</span>
                </div>
              </div>
            {/each}
          </div>
          <div class="mt-2 text-2xl font-bold {playerTotal > 21 ? 'text-red-500' : 'text-yellow-300'}">
            {playerTotal}
          </div>
        </div>

        <!-- Bet Tier Selection (IDLE phase) -->
        {#if state.phase === 'IDLE'}
          <div class="bet-selector">
            <div class="text-sm text-gray-400 mb-2 text-center">Select Bet Tier</div>
            <div class="flex gap-2 justify-center">
              {#each betTiers as tier}
                <button
                  class="bet-btn"
                  class:selected={state.betTier === tier}
                  on:click={() => selectBetTier(tier)}
                >
                  <span class="bet-label">{tier}</span>
                  <span class="bet-value">+{REWARD_VALUES[tier]} 🅰️</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Action Buttons -->
        <div class="action-buttons">
          {#if state.phase === 'IDLE'}
            <button
              class="action-btn deal-btn"
              on:click={deal}
            >
              DEAL
            </button>
          {:else if state.phase === 'PLAYER_TURN'}
            <button
              class="action-btn hit-btn"
              on:click={hit}
            >
              HIT
            </button>
            <button
              class="action-btn stand-btn"
              on:click={stand}
            >
              STAND
            </button>
          {:else if state.phase === 'PAYOUT'}
            {#if state.result === 'WIN'}
              <div class="reward-display">
                {getRewardText()}
              </div>
            {/if}
            <button
              class="action-btn play-btn"
              on:click={playAgain}
            >
              Play Again
            </button>
          {/if}
        </div>
      </div>

      <!-- Ace Token Display -->
      <div class="p-3 bg-gray-800 border-t border-gray-700 text-center">
        <div class="text-xs text-gray-400">Your Ace Tokens</div>
        <div class="text-xl font-bold text-yellow-300">🅰️ {formatNumber($aceTokens)}</div>
      </div>
    </div>
  </div>
{/if}

<style>
  .card-item {
    width: 60px;
    height: 84px;
    perspective: 200px;
  }

  .card-item.dealing {
    animation: card-deal 300ms ease-out forwards;
  }

  @keyframes card-deal {
    from {
      opacity: 0;
      transform: translateY(-50px) scale(0.5);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .card-face {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .card-front {
    background: linear-gradient(135deg, #ffffff 0%, #e8e8e8 100%);
    border: 2px solid #ccc;
  }

  .card-back {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 2px solid #facc15;
  }

  .card-rank {
    font-size: 1.25rem;
    line-height: 1;
  }

  .card-suit {
    font-size: 1.5rem;
    line-height: 1;
  }

  .card-pattern {
    font-size: 1.5rem;
    color: #facc15;
    opacity: 0.5;
  }

  .result-banner {
    text-align: center;
    padding: 12px;
    border-radius: 8px;
    animation: result-pop 400ms ease-out;
  }

  .result-banner.win {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border: 2px solid #4ade80;
  }

  .result-banner.lose {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border: 2px solid #f87171;
  }

  .result-banner.push {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    border: 2px solid #9ca3af;
  }

  @keyframes result-pop {
    0% {
      transform: scale(0.5);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .result-text {
    font-size: 1.5rem;
    font-weight: 900;
    display: block;
  }

  .result-text.win { color: #fff; }
  .result-text.lose { color: #fff; }
  .result-text.push { color: #fff; }

  .result-sub {
    font-size: 0.875rem;
    font-weight: bold;
    color: #fef08a;
    display: block;
  }

  .bet-selector {
    padding: 12px;
    background: #1f2937;
    border-radius: 8px;
  }

  .bet-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 16px;
    border-radius: 8px;
    border: 2px solid #374151;
    background: #374151;
    color: #9ca3af;
    transition: all 200ms ease;
  }

  .bet-btn:hover {
    border-color: #facc15;
  }

  .bet-btn.selected {
    border-color: #facc15;
    background: #422006;
    color: #fbbf24;
  }

  .bet-label {
    font-size: 0.75rem;
    font-weight: bold;
  }

  .bet-value {
    font-size: 0.875rem;
    font-weight: bold;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    min-height: 48px;
  }

  .action-btn {
    padding: 12px 32px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1rem;
    text-transform: uppercase;
    transition: all 200ms ease;
    border: 2px solid;
  }

  .deal-btn {
    background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
    border-color: #fbbf24;
    color: #1f2937;
  }

  .deal-btn:hover {
    background: linear-gradient(135deg, #fde047 0%, #facc15 100%);
  }

  .hit-btn {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border-color: #4ade80;
    color: #fff;
  }

  .hit-btn:hover {
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  }

  .stand-btn {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border-color: #f87171;
    color: #fff;
  }

  .stand-btn:hover {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  }

  .play-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-color: #60a5fa;
    color: #fff;
  }

  .play-btn:hover {
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  }

  .reward-display {
    font-size: 1.25rem;
    font-weight: bold;
    color: #facc15;
    animation: reward-glow 600ms ease-in-out infinite alternate;
  }

  @keyframes reward-glow {
    from {
      text-shadow: 0 0 10px rgba(250, 204, 21, 0.5);
    }
    to {
      text-shadow: 0 0 20px rgba(250, 204, 21, 0.8), 0 0 30px rgba(250, 204, 21, 0.4);
    }
  }
</style>
