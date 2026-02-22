<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    chaseAceState,
    chaseAceTimerText,
    chaseAceBoostActive,
    closeChaseAce,
    startChaseAceRound,
    startChaseAceShuffle,
    advanceChaseAceShuffleStep,
    finishChaseAceShuffle,
    pickChaseAceCard,
    resolveChaseAceRound,
    resetChaseAceForNextRound
  } from '$lib/stores';
  import {
    CHASE_ACE_CARD_COUNT,
    CHASE_ACE_MULTIPLIER,
    CHASE_ACE_SHUFFLE_PATTERN,
    CHASE_ACE_REVEAL_SELECTED_MS,
    CHASE_ACE_REVEAL_REST_DELAY_MS,
    CHASE_ACE_REVEAL_REST_MS,
    type ChaseAceCardTransform
  } from '$lib/chaseAceConfig';

  const cards = Array.from({ length: CHASE_ACE_CARD_COUNT }, (_, i) => i);
  const defaultTransforms = CHASE_ACE_SHUFFLE_PATTERN[CHASE_ACE_SHUFFLE_PATTERN.length - 1].cards;

  let cardTransforms: ChaseAceCardTransform[] = cloneTransforms(defaultTransforms);
  let cardFaceUp = Array.from({ length: CHASE_ACE_CARD_COUNT }, () => false);
  let moveDurationMs = 180;
  let flipDurationMs: number = CHASE_ACE_REVEAL_SELECTED_MS;
  let isPointerLocked = false;
  let lastShuffleRoundId = -1;
  let lastRevealRoundId = -1;
  let previousPhase = '';

  let shuffleTimers: ReturnType<typeof setTimeout>[] = [];
  let revealTimers: ReturnType<typeof setTimeout>[] = [];

  function cloneTransforms(
    source: readonly [ChaseAceCardTransform, ChaseAceCardTransform, ChaseAceCardTransform]
  ): ChaseAceCardTransform[] {
    return source.map((item) => ({ ...item }));
  }

  function clearShuffleTimers() {
    for (const timer of shuffleTimers) clearTimeout(timer);
    shuffleTimers = [];
  }

  function clearRevealTimers() {
    for (const timer of revealTimers) clearTimeout(timer);
    revealTimers = [];
  }

  function setAllFaceDown() {
    cardFaceUp = Array.from({ length: CHASE_ACE_CARD_COUNT }, () => false);
  }

  function resetVisualState() {
    clearShuffleTimers();
    clearRevealTimers();
    isPointerLocked = false;
    moveDurationMs = 180;
    flipDurationMs = CHASE_ACE_REVEAL_SELECTED_MS;
    cardTransforms = cloneTransforms(defaultTransforms);
    setAllFaceDown();
  }

  function startDeterministicShuffleDriver() {
    clearShuffleTimers();
    isPointerLocked = true;
    setAllFaceDown();
    moveDurationMs = CHASE_ACE_SHUFFLE_PATTERN[0]?.durationMs ?? 180;

    let elapsed = 0;
    CHASE_ACE_SHUFFLE_PATTERN.forEach((step) => {
      const stepTimer = setTimeout(() => {
        moveDurationMs = step.durationMs;
        cardTransforms = cloneTransforms(step.cards);
        advanceChaseAceShuffleStep();
      }, elapsed);
      shuffleTimers.push(stepTimer);
      elapsed += step.durationMs;
    });

    const finishTimer = setTimeout(() => {
      isPointerLocked = false;
      finishChaseAceShuffle();
    }, elapsed);
    shuffleTimers.push(finishTimer);
  }

  function startRevealSequence(selectedIndex: number | null) {
    if (selectedIndex === null) return;
    clearRevealTimers();
    isPointerLocked = true;

    flipDurationMs = CHASE_ACE_REVEAL_SELECTED_MS;
    cardFaceUp = cardFaceUp.map((faceUp, index) => (index === selectedIndex ? true : faceUp));

    const restRevealTimer = setTimeout(() => {
      flipDurationMs = CHASE_ACE_REVEAL_REST_MS;
      cardFaceUp = Array.from({ length: CHASE_ACE_CARD_COUNT }, () => true);
    }, CHASE_ACE_REVEAL_REST_DELAY_MS);
    revealTimers.push(restRevealTimer);

    const resolveTimer = setTimeout(() => {
      resolveChaseAceRound();
      isPointerLocked = false;
    }, CHASE_ACE_REVEAL_REST_DELAY_MS + CHASE_ACE_REVEAL_REST_MS);
    revealTimers.push(resolveTimer);
  }

  function cardStyle(index: number): string {
    const t = cardTransforms[index] ?? defaultTransforms[index];
    return `--tx:${t.x}px;--ty:${t.y}px;--rz:${t.rotateDeg}deg;--z:${t.z};--move-ms:${moveDurationMs}ms;--flip-ms:${flipDurationMs}ms;`;
  }

  function formatAddedDuration(ms: number): string {
    if (ms <= 0) return '+0s';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes <= 0) return `+${seconds}s`;
    if (seconds === 0) return `+${minutes}m`;
    return `+${minutes}m ${seconds}s`;
  }

  function handleStartRound() {
    resetVisualState();
    startChaseAceRound();
    startChaseAceShuffle();
  }

  function handleCardPick(index: number) {
    if (isPointerLocked) return;
    pickChaseAceCard(index);
  }

  function closeModal() {
    if ($chaseAceState.phase === 'shuffling' || $chaseAceState.phase === 'revealing') return;
    resetVisualState();
    closeChaseAce();
  }

  $: if ($chaseAceState.phase !== previousPhase) {
    if ($chaseAceState.phase === 'ready') {
      resetVisualState();
    }
    previousPhase = $chaseAceState.phase;
  }

  $: if ($chaseAceState.phase === 'shuffling' && $chaseAceState.roundId !== lastShuffleRoundId) {
    lastShuffleRoundId = $chaseAceState.roundId;
    startDeterministicShuffleDriver();
  }

  $: if ($chaseAceState.phase === 'revealing' && $chaseAceState.roundId !== lastRevealRoundId) {
    lastRevealRoundId = $chaseAceState.roundId;
    startRevealSequence($chaseAceState.selectedIndex);
  }

  onDestroy(() => {
    clearShuffleTimers();
    clearRevealTimers();
  });
</script>

{#if $chaseAceState.isOpen}
  <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-xl border-2 border-yellow-500 bg-gray-900 text-white shadow-2xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-xl font-bold">Chase the Ace</h2>
        <button
          class="w-9 h-9 rounded-md border border-gray-600 bg-gray-800 text-xl leading-none"
          on:click={closeModal}
          disabled={$chaseAceState.phase === 'shuffling' || $chaseAceState.phase === 'revealing'}
          aria-label="Close Chase the Ace"
        >
          x
        </button>
      </div>

      <div class="rounded-lg bg-gray-800 border border-gray-700 p-3 mb-3 text-sm">
        <div class="flex items-center justify-between">
          <span class="text-gray-300">Boost</span>
          <span class="font-bold text-yellow-300">{CHASE_ACE_MULTIPLIER}x</span>
        </div>
        <div class="flex items-center justify-between mt-1">
          <span class="text-gray-300">Time Left</span>
          <span class="font-bold {$chaseAceBoostActive ? 'text-green-300' : 'text-gray-300'}">{$chaseAceTimerText}</span>
        </div>
        <div class="flex items-center justify-between mt-1">
          <span class="text-gray-300">Streak</span>
          <span class="font-bold text-amber-300">{$chaseAceState.streak}</span>
        </div>
      </div>

      <div class="cards-stage mb-4 {isPointerLocked ? 'stage-locked' : ''}">
        {#each cards as index}
          {@const isSelected = $chaseAceState.selectedIndex === index}
          {@const isFaceUp = $chaseAceState.phase === 'result' || cardFaceUp[index]}
          {@const isAce = $chaseAceState.aceIndex === index}
          <button
            class="cta-card-shell {isSelected ? 'card-selected' : ''}"
            style={cardStyle(index)}
            on:click={() => handleCardPick(index)}
            disabled={$chaseAceState.phase !== 'pick' || isPointerLocked}
          >
            <span class="cta-card-inner {isFaceUp ? 'face-up' : ''}">
              <span class="cta-card-face card-front {isAce ? 'card-ace' : 'card-miss'}">
                <span class="card-symbol">{isAce ? 'A' : 'K'}</span>
              </span>
              <span class="cta-card-face card-back">
                <span class="card-symbol">?</span>
              </span>
            </span>
          </button>
        {/each}
      </div>

      {#if $chaseAceState.phase === 'locked'}
        <div class="text-sm text-gray-400 rounded-lg bg-gray-800 border border-gray-700 p-3">
          Unlock Card Shufflers to play.
        </div>
      {:else if $chaseAceState.phase === 'ready'}
        <button
          class="w-full py-3 rounded-lg font-bold border-2 border-yellow-400 bg-gradient-to-b from-yellow-600 to-yellow-800"
          on:click={handleStartRound}
        >
          Start Round
        </button>
      {:else if $chaseAceState.phase === 'shuffling'}
        <div class="text-sm text-gray-300 text-center">Shuffling...</div>
      {:else if $chaseAceState.phase === 'pick'}
        <div class="text-sm text-center text-yellow-300">Pick one card.</div>
      {:else if $chaseAceState.phase === 'revealing'}
        <div class="text-sm text-center text-gray-300">Revealing cards...</div>
      {:else if $chaseAceState.phase === 'result'}
        <div class="space-y-2">
          <div class="text-sm text-center {$chaseAceState.didWin ? 'text-green-300' : 'text-red-300'}">
            {$chaseAceState.didWin ? 'You found the Ace.' : 'Missed the Ace.'}
          </div>
          <div class="text-sm text-center text-gray-300">
            {formatAddedDuration($chaseAceState.addedDurationMs)}
          </div>
          <button
            class="w-full py-3 rounded-lg font-bold border-2 border-yellow-400 bg-gradient-to-b from-yellow-600 to-yellow-800"
            on:click={resetChaseAceForNextRound}
          >
            Next Round
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .cards-stage {
    position: relative;
    width: 100%;
    height: 150px;
    border-radius: 12px;
    border: 1px solid #374151;
    background: radial-gradient(80% 80% at 50% 20%, rgba(250, 204, 21, 0.08), rgba(0, 0, 0, 0));
    overflow: hidden;
  }

  .stage-locked {
    pointer-events: none;
  }

  .cta-card-shell {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 86px;
    height: 120px;
    border: 0;
    padding: 0;
    background: transparent;
    z-index: var(--z);
    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(var(--rz));
    transition: transform var(--move-ms) ease;
    transform-style: preserve-3d;
    perspective: 900px;
  }

  .cta-card-inner {
    width: 100%;
    height: 100%;
    display: block;
    position: relative;
    transform-style: preserve-3d;
    transition: transform var(--flip-ms) ease;
    transform: rotateY(0deg);
  }

  .cta-card-inner.face-up {
    transform: rotateY(180deg);
  }

  .cta-card-face {
    position: absolute;
    inset: 0;
    border-radius: 10px;
    border: 2px solid #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    backface-visibility: hidden;
  }

  .card-front {
    transform: rotateY(180deg);
  }

  .card-back {
    background: linear-gradient(180deg, #1f2937, #111827);
    color: #fcd34d;
  }

  .card-ace {
    background: linear-gradient(180deg, #fff2cc, #f3cb66);
    color: #1f2937;
    border-color: #fbbf24;
  }

  .card-miss {
    background: linear-gradient(180deg, #f3f4f6, #d1d5db);
    color: #111827;
    border-color: #9ca3af;
  }

  .card-selected {
    outline: 2px solid #facc15;
    outline-offset: 2px;
  }

  .card-symbol {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1;
  }
</style>
