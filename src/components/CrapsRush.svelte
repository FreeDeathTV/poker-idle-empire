<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    crapsRushState,
    crapsRushDiscountActive,
    crapsRushRemainingMinutes,
    crapsRushCooldownRemainingSeconds,
    crapsRushCanPlay,
    closeCrapsRush,
    startRound,
    resolveRound,
    resetForNextRound,
    type BetType,
    type GamePhase
  } from '$lib/expansionDiscount';
  import { rollDice, getOutcomeGroup } from '$lib/crapsRng';

  // Animation state
  let diceAnimationPhase: 'idle' | 'shaking' | 'rolling' | 'settling' = 'idle';
  let displayDieA = 1;
  let displayDieB = 1;
  let displayTotal = 2;
  let animationTimer: ReturnType<typeof setTimeout> | null = null;

  // Bet type selection
  let selectedBetType: BetType | null = null;

  // Cooldown timer interval
  let cooldownInterval: ReturnType<typeof setInterval> | null = null;
  let displayedCooldownSeconds = 0;

  // Dice animation durations (deterministic per V1200)
  const SHAKE_DURATION = 400;
  const ROLL_DURATION = 300;
  const SETTLE_DURATION = 500;

  function startDiceAnimation(seed: number) {
    if (animationTimer) clearTimeout(animationTimer);

    diceAnimationPhase = 'shaking';

    // Shake phase
    animationTimer = setTimeout(() => {
      diceAnimationPhase = 'rolling';

      // Rolling phase - rapid die changes
      animationTimer = setTimeout(() => {
        // Get actual result
        const { dieA, dieB, total } = rollDice(seed);
        displayDieA = dieA;
        displayDieB = dieB;
        displayTotal = total;

        diceAnimationPhase = 'settling';

        // Settle phase
        animationTimer = setTimeout(() => {
          diceAnimationPhase = 'idle';
          // Resolve the round after animation completes
          resolveRound();
        }, SETTLE_DURATION);
      }, ROLL_DURATION);
    }, SHAKE_DURATION);
  }

  function handleBetSelect(betType: BetType) {
    selectedBetType = betType;
    startRound(betType);

    // Get the seed that was set in the store
    const state = $crapsRushState;
    if (state.roundSeed) {
      startDiceAnimation(state.roundSeed);
    }
  }

  function handlePlayAgain() {
    selectedBetType = null;
    resetForNextRound();
  }

  function closeModal() {
    if ($crapsRushState.phase === 'ROLL' || $crapsRushState.phase === 'shaking') return;
    if (animationTimer) clearTimeout(animationTimer);
    closeCrapsRush();
  }

  // Update cooldown display
  $: if ($crapsRushState.phase === 'COOLDOWN' || $crapsRushState.phase === 'ROLL' || $crapsRushState.phase === 'RESULT') {
    if (!cooldownInterval) {
      cooldownInterval = setInterval(() => {
        displayedCooldownSeconds = $crapsRushCooldownRemainingSeconds;
        if (displayedCooldownSeconds <= 0 && cooldownInterval) {
          clearInterval(cooldownInterval);
          cooldownInterval = null;
        }
      }, 1000);
    }
  }

  $: displayedCooldownSeconds = $crapsRushCooldownRemainingSeconds;

  function formatCooldown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function getOutcomeLabel(total: number | null): string {
    if (total === null) return '';
    const outcome = getOutcomeGroup(total);
    switch (outcome) {
      case 'WIN': return 'WIN!';
      case 'BONUS': return 'BONUS';
      case 'LOSE': return 'LOSE';
      case 'SAFE': return 'SAFE';
    }
  }

  function getBetTypeLabel(betType: BetType | null): string {
    if (betType === null) return '';
    switch (betType) {
      case 'HIGH': return 'HIGH RISK';
      case 'MEDIUM': return 'MEDIUM RISK';
      case 'LOW': return 'LOW RISK';
    }
  }

  function getDurationAddedText(ms: number): string {
    if (ms <= 0) return '+0 min';
    const minutes = Math.floor(ms / 60000);
    return `+${minutes} min`;
  }

  function getZoneClass(outcome: string): string {
    switch (outcome) {
      case 'WIN': return 'zone-win';
      case 'BONUS': return 'zone-bonus';
      case 'SAFE': return 'zone-safe';
      case 'LOSE': return 'zone-lose';
      default: return '';
    }
  }

  // Cleanup
  onDestroy(() => {
    if (animationTimer) clearTimeout(animationTimer);
    if (cooldownInterval) clearInterval(cooldownInterval);
  });
</script>

{#if $crapsRushState.isOpen}
  <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-xl border-2 border-yellow-500 bg-gray-900 text-white shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div>
          <h2 class="text-xl font-bold text-yellow-400">Craps Rush</h2>
          <div class="text-xs text-gray-400">Expansion Discount Minigame</div>
        </div>
        <button
          class="w-9 h-9 rounded-md border border-gray-600 bg-gray-700 text-xl leading-none hover:bg-gray-600"
          on:click={closeModal}
          disabled={$crapsRushState.phase === 'ROLL' || diceAnimationPhase !== 'idle'}
          aria-label="Close Craps Rush"
        >
          x
        </button>
      </div>

      <!-- Discount Status -->
      <div class="p-3 bg-gray-800 border-b border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-green-400 text-lg">🏢</span>
            <span class="text-sm text-gray-300">Expansion Discount</span>
          </div>
          <div class="flex items-center gap-2">
            {#if $crapsRushDiscountActive}
              <span class="px-2 py-1 rounded bg-green-600 text-white text-xs font-bold animate-pulse">
                {$crapsRushRemainingMinutes}m LEFT
              </span>
            {:else}
              <span class="px-2 py-1 rounded bg-gray-600 text-gray-300 text-xs">
                INACTIVE
              </span>
            {/if}
          </div>
        </div>
        <div class="mt-2 flex items-center justify-between text-xs">
          <span class="text-gray-400">Streak: <span class="text-amber-400 font-bold">{$crapsRushState.winStreak}</span></span>
          <span class="text-gray-400">Daily: <span class="text-cyan-400 font-bold">{$crapsRushState.dailyDiscountAccumulatedMinutes}/60 min</span></span>
        </div>
      </div>

      <!-- Craps Table -->
      <div class="p-4">
        <!-- Zones -->
        <div class="craps-table mb-4">
          <!-- WIN Zone (top) -->
          <div class="zone zone-win {$crapsRushState.diceTotal !== null && getOutcomeGroup($crapsRushState.diceTotal) === 'WIN' ? 'highlighted' : ''}">
            <span class="zone-label">WIN</span>
            <span class="zone-desc">7, 11</span>
            <span class="zone-reward">+15 min</span>
          </div>

          <!-- BONUS Zone (middle) -->
          <div class="zone zone-bonus {$crapsRushState.diceTotal !== null && getOutcomeGroup($crapsRushState.diceTotal) === 'BONUS' ? 'highlighted' : ''}">
            <span class="zone-label">BONUS</span>
            <span class="zone-desc">4, 5, 6, 8, 9, 10</span>
            <span class="zone-reward">+10 min</span>
          </div>

          <!-- SAFE Zone (bottom) -->
          <div class="zone zone-safe {$crapsRushState.diceTotal !== null && getOutcomeGroup($crapsRushState.diceTotal) === 'SAFE' ? 'highlighted' : ''}">
            <span class="zone-label">SAFE</span>
            <span class="zone-desc">Not 2, 3, 12</span>
            <span class="zone-reward">+5 min</span>
          </div>
        </div>

        <!-- Dice Display -->
        <div class="dice-container mb-4">
          <div class="dice-area {diceAnimationPhase}">
            <div class="die die-a {diceAnimationPhase}">{displayDieA}</div>
            <div class="die-separator">+</div>
            <div class="die die-b {diceAnimationPhase}">{displayDieB}</div>
          </div>
          <div class="dice-total">
            Total: <span class="text-2xl font-bold text-yellow-400">{displayTotal}</span>
          </div>
        </div>

        <!-- Result Display -->
        {#if $crapsRushState.phase === 'RESULT' && $crapsRushState.diceTotal !== null}
          <div class="result-banner {$crapsRushState.didWin ? 'win' : 'lose'} mb-4">
            <div class="result-main">
              {#if $crapsRushState.didWin}
                <span class="result-icon">🎉</span>
                <span class="result-text">WIN!</span>
              {:else}
                <span class="result-icon">😢</span>
                <span class="result-text">LOSE</span>
              {/if}
            </div>
            <div class="result-details">
              {#if $crapsRushState.winStreak >= 3 && !$crapsRushState.didWin}
                <span class="text-orange-400 text-sm">Streak broken!</span>
              {/if}
              <span class="text-lg">{getDurationAddedText($crapsRushState.addedDurationMs)}</span>
            </div>
          </div>
        {/if}

        <!-- Cooldown Display -->
        {#if $crapsRushState.phase === 'COOLDOWN' || displayedCooldownSeconds > 0}
          <div class="cooldown-display mb-4">
            <div class="cooldown-icon">⏳</div>
            <div class="cooldown-text">
              Next play in: <span class="text-yellow-400 font-bold">{formatCooldown(displayedCooldownSeconds)}</span>
            </div>
          </div>
        {/if}

        <!-- Bet Selection / Controls -->
        {#if $crapsRushState.phase === 'BET_SELECT'}
          <div class="bet-buttons">
            <button
              class="bet-btn bet-high"
              on:click={() => handleBetSelect('HIGH')}
              disabled={!$crapsRushCanPlay}
            >
              <span class="bet-title">HIGH RISK <span class="</span>
             bet-desc">7, 11</span>
              <span class="bet-reward">+15 min</span>
            </button>
            <button
              class="bet-btn bet-medium"
              on:click={() => handleBetSelect('MEDIUM')}
              disabled={!$crapsRushCanPlay}
            >
              <span class="bet-title">MEDIUM</span>
              <span class="bet-desc">4-10 (not 7)</span>
              <span class="bet-reward">+10 min</span>
            </button>
            <button
              class="bet-btn bet-low"
              on:click={() => handleBetSelect('LOW')}
              disabled={!$crapsRushCanPlay}
            >
              <span class="bet-title">SAFE</span>
              <span class="bet-desc">Not 2,3,12</span>
              <span class="bet-reward">+5 min</span>
            </button>
          </div>

          {#if !$crapsRushCanPlay && $crapsRushState.dailyDiscountAccumulatedMinutes >= 60}
            <div class="text-center text-gray-400 text-sm mt-2">
              Daily cap reached (60 min)! Come back tomorrow.
            </div>
          {/if}

        {:else if $crapsRushState.phase === 'ROLL' || diceAnimationPhase !== 'idle'}
          <div class="text-center text-yellow-300 py-4">
            Rolling...
          </div>

        {:else if $crapsRushState.phase === 'RESULT'}
          <button
            class="w-full py-3 rounded-lg font-bold border-2 border-yellow-400 bg-gradient-to-b from-yellow-600 to-yellow-800"
            on:click={handlePlayAgain}
          >
            Play Again
          </button>

        {:else if $crapsRushState.phase === 'COOLDOWN'}
          <div class="text-center text-gray-400 py-4">
            Please wait for cooldown to end...
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .craps-table {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: linear-gradient(180deg, #1a472a 0%, #2d5a3d 50%, #1a472a 100%);
    border-radius: 12px;
    border: 3px solid #4a3f2a;
  }

  .zone {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .zone.highlighted {
    box-shadow: 0 0 20px currentColor;
    transform: scale(1.02);
  }

  .zone-win {
    background: linear-gradient(90deg, #166534, #22c55e);
    border: 2px solid #4ade80;
    color: white;
  }

  .zone-bonus {
    background: linear-gradient(90deg, #1d4ed8, #3b82f6);
    border: 2px solid #60a5fa;
    color: white;
  }

  .zone-safe {
    background: linear-gradient(90deg, #a16207, #d97706);
    border: 2px solid #fbbf24;
    color: white;
  }

  .zone-lose {
    background: linear-gradient(90deg, #991b1b, #ef4444);
    border: 2px solid #f87171;
    color: white;
  }

  .zone-label {
    font-weight: 800;
    font-size: 1.1rem;
  }

  .zone-desc {
    font-size: 0.75rem;
    opacity: 0.9;
  }

  .zone-reward {
    font-weight: 700;
    font-size: 0.85rem;
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 8px;
    border-radius: 4px;
  }

  .dice-container {
    text-align: center;
  }

  .dice-area {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .die {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    font-weight: 800;
    border-radius: 10px;
    background: linear-gradient(145deg, #fefefe, #e5e7eb);
    color: #1f2937;
    box-shadow: 
      0 4px 0 #9ca3af,
      0 6px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.1s ease;
  }

  .die.shaking {
    animation: shake 0.1s infinite;
  }

  .die.rolling {
    animation: roll 0.15s infinite;
  }

  .die.settling {
    animation: settle 0.2s ease-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px) rotate(-5deg); }
    75% { transform: translateX(4px) rotate(5deg); }
  }

  @keyframes roll {
    0% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(180deg); }
    100% { transform: translateY(0) rotate(360deg); }
  }

  @keyframes settle {
    0% { transform: translateY(-20px); }
    60% { transform: translateY(4px); }
    100% { transform: translateY(0); }
  }

  .die-separator {
    font-size: 1.5rem;
    font-weight: bold;
    color: #9ca3af;
  }

  .dice-total {
    font-size: 0.9rem;
    color: #9ca3af;
  }

  .result-banner {
    padding: 16px;
    border-radius: 10px;
    text-align: center;
    border: 2px solid;
  }

  .result-banner.win {
    background: linear-gradient(180deg, #166534, #14532d);
    border-color: #4ade80;
  }

  .result-banner.lose {
    background: linear-gradient(180deg, #7f1d1d, #450a0a);
    border-color: #f87171;
  }

  .result-main {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .result-icon {
    font-size: 1.5rem;
  }

  .result-text {
    font-size: 1.5rem;
    font-weight: 800;
  }

  .result-banner.win .result-text {
    color: #4ade80;
  }

  .result-banner.lose .result-text {
    color: #f87171;
  }

  .result-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #fbbf24;
    font-weight: 700;
  }

  .cooldown-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: rgba(31, 41, 55, 0.8);
    border-radius: 8px;
    border: 1px solid #4b5563;
  }

  .cooldown-icon {
    font-size: 1.5rem;
  }

  .cooldown-text {
    color: #9ca3af;
    font-size: 0.9rem;
  }

  .bet-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .bet-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    border-radius: 10px;
    border: 2px solid;
    transition: all 0.2s ease;
  }

  .bet-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .bet-btn:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .bet-high {
    background: linear-gradient(180deg, #166534, #14532d);
    border-color: #4ade80;
  }

  .bet-medium {
    background: linear-gradient(180deg, #1d4ed8, #1e3a8a);
    border-color: #60a5fa;
  }

  .bet-low {
    background: linear-gradient(180deg, #a16207, #78350f);
    border-color: #fbbf24;
  }

  .bet-title {
    font-weight: 800;
    font-size: 1rem;
    color: white;
  }

  .bet-desc {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 2px;
  }

  .bet-reward {
    font-weight: 700;
    font-size: 0.85rem;
    color: #fbbf24;
    margin-top: 4px;
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 10px;
    border-radius: 4px;
  }
</style>
