<script lang="ts">
  import { resetFlowActive, resetFlowStage, selectedMethod, spinResult, canReSpin, prestigePoints } from '$lib/stores';
  import { startResetFlow, applyResetFlow, performReSpin, calculateBaseBonus, spinWheel } from '$lib/gameLogic';
  import Confetti from './Confetti.svelte';
  import type { EscapeMethod } from '$lib/stores';

  let wheelSpinning = false;
  let displayedOutcome = { name: '', multiplier: 0 };

  // Method definitions
  const methods = [
    { id: 'relocation' as EscapeMethod, label: 'Relocation Officer', icon: '💼', description: 'Safe, official escape', avgMultiplier: '1.3×' },
    { id: 'identity' as EscapeMethod, label: 'New Identity Kit', icon: '🎭', description: 'Risky makeover', avgMultiplier: '1.5×' },
    { id: 'run' as EscapeMethod, label: 'Just Run', icon: '👟', description: 'Desperate sprint', avgMultiplier: '1.1×' }
  ];

  // Watch for stage transitions
  $: if ($resetFlowStage === 2 && $selectedMethod && !wheelSpinning) {
    wheelSpinning = true;
    startWheelAnimation();
  }

  function startWheelAnimation() {
    // Animate the wheel for 2 seconds
    const startTime = Date.now();
    const duration = 2000; // 2 seconds

    const animateWheel = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        // During animation, show random outcomes
        const tempOutcome = spinWheel($selectedMethod!);
        displayedOutcome = tempOutcome;
        requestAnimationFrame(animateWheel);
      } else {
        // Animation complete - get final outcome
        const finalOutcome = spinWheel($selectedMethod!);
        spinResult.set(finalOutcome);
        displayedOutcome = finalOutcome;
        wheelSpinning = false;
        // Auto-advance to stage 3
        resetFlowStage.set(3);
      }
    };

    animateWheel();
  }

  function handleMethodSelect(method: EscapeMethod) {
    selectedMethod.set(method);
    resetFlowStage.set(2);
  }

  function handleConfirm() {
    const method = $selectedMethod;
    if (method) {
      applyResetFlow(method);
      resetFlowActive.set(false);
    }
  }

  function handleReSpin() {
    performReSpin();
    // Re-animate with new result
    const outcome = $spinResult || { name: '', multiplier: 0};
    displayedOutcome = outcome;
  }

  function handleClose() {
    resetFlowActive.set(false);
    resetFlowStage.set(1);
    selectedMethod.set(null);
    spinResult.set(null);
  }

  // Calculate current bonus for display
  function getCurrentBonus() {
    const resets = $prestigePoints;
    return calculateBaseBonus(resets);
  }

  // Determine if confetti should show (multiplier > 1.5×)
  $: showConfetti = $resetFlowStage === 3 && ($spinResult?.multiplier ?? 0) > 1.5;
</script>

<!-- Main modal container -->
{#if $resetFlowActive}
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 rounded-xl p-8 max-w-md w-full border-4 border-amber-500 shadow-2xl">

      <!-- Stage 1: Method Selection -->
      {#if $resetFlowStage === 1}
        <h1 class="text-2xl font-bold text-white text-center mb-2">Escape & Relocate</h1>
        <p class="text-gray-300 text-center text-sm mb-6">Already accumulated 1e12 chips. Time to vanish and start fresh...</p>

        <div class="space-y-3">
          {#each methods as method (method.id)}
            <button
              on:click={() => handleMethodSelect(method.id)}
              class="w-full p-4 bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-amber-500 rounded-lg transition-all text-left group"
            >
              <div class="flex items-start gap-3">
                <div class="text-3xl group-hover:scale-110 transition-transform">{method.icon}</div>
                <div class="flex-1">
                  <h3 class="font-bold text-white text-lg">{method.label}</h3>
                  <p class="text-gray-400 text-sm">{method.description}</p>
                  <p class="text-amber-400 text-sm font-semibold mt-1">Avg Bonus: {method.avgMultiplier}</p>
                </div>
              </div>
            </button>
          {/each}
        </div>

        <button
          on:click={handleClose}
          class="w-full mt-6 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
      {/if}

      <!-- Stage 2: Wheel Spin -->
      {#if $resetFlowStage === 2}
        <h2 class="text-xl font-bold text-white text-center mb-6">Spinning the wheel...</h2>

        <!-- Spinning wheel animation -->
        <div class="flex flex-col items-center justify-center py-12">
          <div class="relative w-32 h-32 mb-6">
            <!-- Wheel container with continuous spin -->
            <div
              class="absolute inset-0 rounded-full border-8 border-amber-500 flex items-center justify-center bg-gradient-to-br from-amber-600 to-amber-800 animate-spin"
              style="animation-duration: 0.5s"
            >
              <div class="text-center">
                <div class="text-4xl mb-1">{displayedOutcome.multiplier.toFixed(1)}</div>
                <div class="text-xs text-amber-100">×</div>
              </div>
            </div>

            <!-- Center pointer -->
            <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div class="text-2xl">▼</div>
            </div>
          </div>

          <p class="text-center text-gray-300 text-sm">
            {displayedOutcome.name || 'Determining fate...'}
          </p>
        </div>
      {/if}

      <!-- Stage 3: Results -->
      {#if $resetFlowStage === 3}
        <h2 class="text-2xl font-bold text-white text-center mb-2">🎉 Escape Successful!</h2>

        <!-- Result display -->
        {#if $spinResult}
          <div class="bg-gradient-to-r from-amber-900/50 to-amber-800/50 border-2 border-amber-500 rounded-lg p-6 text-center mb-6">
            <div class="text-5xl font-bold text-amber-400 mb-2">×{$spinResult.multiplier.toFixed(1)}</div>
            <div class="text-lg font-semibold text-white mb-1">{$spinResult.name}</div>
            <div class="text-gray-300 text-sm">Signing bonus applied!</div>
          </div>
        {/if}

        <!-- Confetti trigger -->
        {#if showConfetti}
          <Confetti />
        {/if}

        <!-- Re-spin option -->
        {#if $canReSpin}
          <button
            on:click={handleReSpin}
            class="w-full mb-3 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
          >
            Re-spin (10% of bonus)
          </button>
        {:else}
          <div class="w-full mb-3 py-3 px-4 bg-gray-700 text-gray-400 rounded-lg text-center text-sm font-semibold">
            Re-spin used
          </div>
        {/if}

        <!-- Confirm and apply reset -->
        <button
          on:click={handleConfirm}
          class="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors mb-3"
        >
          Confirm Escape
        </button>

        <!-- Close button -->
        <button
          on:click={handleClose}
          class="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
      {/if}

    </div>
  </div>

  <!-- Confetti positioned absolutely for absolute positioning in modal -->
  {#if showConfetti}
    <div class="fixed inset-0 pointer-events-none z-50">
      <Confetti />
    </div>
  {/if}
{/if}

<style>
  :global(.reset-flow-modal) {
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
