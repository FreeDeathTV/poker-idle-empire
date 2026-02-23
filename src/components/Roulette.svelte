<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import { chips, formatNumber } from '$lib/stores';
  import {
    EUROPEAN_WHEEL_ORDER,
    ROULETTE_OUTSIDE,
    getBetKey,
    getRouletteColor,
    mergeBet,
    normalizeNumbers,
    removeLastBetChip,
    resolveRouletteBets,
    type RouletteBet,
    type RouletteBetType,
    type RouletteColor
  } from '$lib/rouletteLogic';
  import RouletteChip from './RouletteChip.svelte';
  import RouletteRows from './RouletteRows.svelte';

  export let open = false;
  const dispatch = createEventDispatcher<{ close: void; spinComplete: void }>();

  const spinDuration = 2500;
  const spinEasing = 'cubic-bezier(0.1, 0.8, 0.2, 1)';
  const ballEasing = 'cubic-bezier(0.1, 0.8, 0.2, 1)';
  const PRE_SPIN_DELAY_MS = 100;
  const SNAP_DURATION_MS = 300;
  const RESULT_FLASH_MS = 1000;
  const BOARD_PULSE_MS = 1500;
  const WHEEL_FADE_MS = 300;
  const BET_OPTIONS = [1, 5, 10, 25, 50, 100, 500, 1000, 5000, 10000, 50000] as const;

  let betAmount: number = BET_OPTIONS[0];
  let bets: RouletteBet[] = [];
  let confirmBetsModal = false;
  let showWheelOverlay = false;
  let showResultFlash = false;
  let showSummaryModal = false;
  let wheelFadeOut = false;
  let boardHidden = false;
  let isSpinning = false;
  let betsLocked = false;
  let wheelAngle = 0;
  let ballAngle = 0;
  let wheelTransitionDurationMs = 0;
  let ballTransitionDurationMs = 0;
  let wheelTransitionEasing = spinEasing;
  let ballTransitionEasing = ballEasing;
  let winningNumber: number | null = null;
  let winningColor: RouletteColor = 'green';
  let lastWinningNumber: number | null = null;
  let pulseWinningNumber = false;
  let totalPayout = 0;
  let totalNet = 0;
  let shakeChips = false;
  let winningKeys = new Set<string>();
  let losingKeys = new Set<string>();
  let betChipsByKey = new Map<string, number[]>();
  let longPressTimers = new Map<string, ReturnType<typeof setTimeout>>();
  let suppressTapForKeys = new Set<string>();
  let activeSpinId = 0;
  const LONG_PRESS_MS = 450;

  $: maxBet = Math.floor($chips * 0.01);
  $: totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);
  $: placementLocked = betsLocked || totalBet >= maxBet;
  $: if (maxBet > 0 && betAmount > maxBet) {
    const fallbackOption = [...BET_OPTIONS].reverse().find((option) => option <= maxBet);
    betAmount = fallbackOption ?? Math.max(1, maxBet);
  }
  $: if (!open) hardResetState();
  $: {
    const next = new Map<string, number[]>();
    for (const bet of bets) {
      const key = getBetKey(bet.type, bet.numbers);
      const chipValues = (bet.chipValues ?? [bet.amount])
        .map((value) => Math.max(0, Math.floor(value)))
        .filter((value) => value > 0);
      next.set(key, chipValues);
    }
    betChipsByKey = next;
  }
  const TOP_ROW_START = 0;
  const BOTTOM_ROW_START = 6;
  const SECTION_ROW_COUNT = 6;
  const zeroStraightNumbers = [0];
  
  // Even chances (1:1 payouts) - displayed prominently
  const evenChanceEntries: { label: string; type: RouletteBetType; numbers: number[] }[] = [
    { label: 'Red', type: 'redblack', numbers: [...ROULETTE_OUTSIDE.red] },
    { label: 'Black', type: 'redblack', numbers: [...ROULETTE_OUTSIDE.black] },
    { label: 'Odd', type: 'oddeven', numbers: [...ROULETTE_OUTSIDE.odd] },
    { label: 'Even', type: 'oddeven', numbers: [...ROULETTE_OUTSIDE.even] },
    { label: '1-18', type: 'highlow', numbers: [...ROULETTE_OUTSIDE.low] },
    { label: '19-36', type: 'highlow', numbers: [...ROULETTE_OUTSIDE.high] },
  ];
  
  // Dozens (2:1 payouts)
  const dozenEntries: { label: string; type: RouletteBetType; numbers: number[] }[] = [
    { label: '1st 12', type: 'dozen', numbers: [...ROULETTE_OUTSIDE.dozen1] },
    { label: '2nd 12', type: 'dozen', numbers: [...ROULETTE_OUTSIDE.dozen2] },
    { label: '3rd 12', type: 'dozen', numbers: [...ROULETTE_OUTSIDE.dozen3] },
  ];
  
  // Columns (2:1 payouts)
  const columnEntries: { label: string; type: RouletteBetType; numbers: number[] }[] = [
    { label: '2 to 1', type: 'column', numbers: [...ROULETTE_OUTSIDE.column1] },
    { label: '2 to 1', type: 'column', numbers: [...ROULETTE_OUTSIDE.column2] },
    { label: '2 to 1', type: 'column', numbers: [...ROULETTE_OUTSIDE.column3] },
  ];
  const pocketAngles = EUROPEAN_WHEEL_ORDER.reduce(
    (map, pocket, index) => {
      map[pocket] = index * (360 / EUROPEAN_WHEEL_ORDER.length);
      return map;
    },
    {} as Record<number, number>
  );

  function emitToast(text: string): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('appToast', { detail: { text } }));
  }

  function isValidBet(type: RouletteBetType, numbers: number[]): boolean {
    const n = normalizeNumbers(numbers);
    if (n.some((value) => value < 0 || value > 36)) return false;
    if (type === 'straight') return n.length === 1;
    if (type === 'split') return n.length === 2;
    if (type === 'street') return n.length === 3;
    if (type === 'corner') return n.length === 4;
    if (type === 'line') return n.length === 6;
    return n.length === 12 || n.length === 18;
  }

  function placeBet(type: RouletteBetType, numbers: number[]): void {
    if (placementLocked || isSpinning) return emitToast('Invalid bet.');
    const normalized = normalizeNumbers(numbers);
    if (!isValidBet(type, normalized)) return emitToast('Invalid bet.');

    const amount = Math.max(1, Math.floor(betAmount));
    if (maxBet <= 0 || totalBet + amount > maxBet) return triggerMaxBetReached();
    bets = mergeBet(bets, { type, numbers: normalized, amount, chipValues: [amount] });
  }

  function triggerMaxBetReached(): void {
    shakeChips = true;
    emitToast('Max bet reached.');
    setTimeout(() => (shakeChips = false), 280);
  }

  // Use a reactive function that always reads the current betChipsByKey value
  $: getChipsFor = (type: RouletteBetType, numbers: number[]): number[] => {
    const key = getBetKey(type, normalizeNumbers(numbers));
    return betChipsByKey.get(key) ?? [];
  };

  function removeLastChip(type: RouletteBetType, numbers: number[]): void {
    if (placementLocked || isSpinning) return emitToast('Invalid bet.');
    const normalized = normalizeNumbers(numbers);
    if (!isValidBet(type, normalized)) return emitToast('Invalid bet.');
    bets = removeLastBetChip(bets, type, normalized);
  }

  function handleBetTap(type: RouletteBetType, numbers: number[]): void {
    const normalized = normalizeNumbers(numbers);
    const key = getBetKey(type, normalized);
    if (suppressTapForKeys.has(key)) {
      suppressTapForKeys.delete(key);
      return;
    }
    placeBet(type, normalized);
  }

  function handleBetRemove(type: RouletteBetType, numbers: number[]): void {
    removeLastChip(type, numbers);
  }

  function handleBetPressStart(type: RouletteBetType, numbers: number[]): void {
    if (placementLocked || isSpinning) return;
    const normalized = normalizeNumbers(numbers);
    if (!isValidBet(type, normalized)) return;

    const key = getBetKey(type, normalized);
    clearLongPressTimer(key);
    const timer = setTimeout(() => {
      longPressTimers.delete(key);
      if (getChipsFor(type, normalized).length === 0) return;
      suppressTapForKeys.add(key);
      removeLastChip(type, normalized);
    }, LONG_PRESS_MS);
    longPressTimers.set(key, timer);
  }

  function handleBetPressEnd(type: RouletteBetType, numbers: number[]): void {
    const key = getBetKey(type, normalizeNumbers(numbers));
    clearLongPressTimer(key);
  }

  function onBetContextMenu(event: MouseEvent, type: RouletteBetType, numbers: number[]): void {
    event.preventDefault();
    handleBetPressEnd(type, numbers);
    handleBetRemove(type, numbers);
  }

  function resultClass(type: RouletteBetType, numbers: number[]): string {
    const key = getBetKey(type, normalizeNumbers(numbers));
    if (winningKeys.has(key)) return 'zone-win';
    if (losingKeys.has(key)) return 'zone-lose';
    return '';
  }

  function clearAllBets(): void {
    if (isSpinning) return;
    clearAllLongPressTimers();
    bets = [];
    winningKeys = new Set<string>();
    losingKeys = new Set<string>();
    lastWinningNumber = null;
    pulseWinningNumber = false;
    totalPayout = 0;
    totalNet = 0;
  }

  function closeModal(): void {
    if (isSpinning) return;
    dispatch('close');
  }

  function openConfirmBets(): void {
    if (isSpinning || betsLocked) return emitToast('Invalid bet.');
    if (totalBet <= 0) return emitToast('Invalid bet.');
    confirmBetsModal = true;
  }

  async function confirmAndSpin(): Promise<void> {
    if (isSpinning || totalBet <= 0) return;
    const spinId = Date.now();
    activeSpinId = spinId;
    confirmBetsModal = false;
    betsLocked = true;
    isSpinning = true;
    boardHidden = true;
    wheelFadeOut = false;
    showWheelOverlay = true;
    emitToast('No more bets!');

    await wait(PRE_SPIN_DELAY_MS);
    winningNumber = Math.floor(Math.random() * 37);
    winningColor = getRouletteColor(winningNumber);
    const spinAmount = randomBetween(1800, 2520);
    setSpinTransitions(spinDuration, spinEasing, ballEasing);
    wheelAngle += spinAmount;
    ballAngle -= spinAmount * 1.3;

    await wait(spinDuration);
    if (activeSpinId !== spinId || winningNumber === null) return;

    const result = resolveRouletteBets(bets, winningNumber);
    totalPayout = result.totalPayout;
    totalNet = result.winningNet;
    winningKeys = result.winningKeys;
    losingKeys = result.losingKeys;
    chips.update((value) => Math.max(0, value + result.winningNet));

    if (winningNumber === 0) emitToast('Zero! House takes it all - better luck next spin!');
    if (result.winningNet > 0 && result.winningNet >= Math.max(1, result.totalBet * 10)) emitToast('Big win!');
    dispatch('spinComplete');

    setSpinTransitions(0, spinEasing, ballEasing);
    wheelAngle = normalizeAngle(wheelAngle);
    ballAngle = normalizeAngle(ballAngle);
    await tick();
    if (activeSpinId !== spinId || winningNumber === null) return;

    const finalAngle = getFinalWheelAngle(winningNumber);
    const ballLandingOffset = randomBetween(5, 10);
    setSpinTransitions(SNAP_DURATION_MS, spinEasing, ballEasing);
    wheelAngle = finalAngle;
    ballAngle = finalAngle + ballLandingOffset;

    await wait(SNAP_DURATION_MS);
    if (activeSpinId !== spinId) return;

    showResultFlash = true;
    await wait(RESULT_FLASH_MS);
    if (activeSpinId !== spinId) return;
    showResultFlash = false;
    wheelFadeOut = true;
    await wait(WHEEL_FADE_MS);
    if (activeSpinId !== spinId || winningNumber === null) return;

    showWheelOverlay = false;
    boardHidden = false;
    lastWinningNumber = winningNumber;
    pulseWinningNumber = true;
    setTimeout(() => {
      if (activeSpinId === spinId) pulseWinningNumber = false;
    }, BOARD_PULSE_MS);

    showSummaryModal = true;
    isSpinning = false;
    betsLocked = false;
    setSpinTransitions(0, spinEasing, ballEasing);
  }

  function playAgain(): void {
    showSummaryModal = false;
    clearAllBets();
  }

  function returnToMainScreen(): void {
    showSummaryModal = false;
    clearAllBets();
    dispatch('close');
  }

  function hardResetState(): void {
    activeSpinId += 1;
    clearAllLongPressTimers();
    confirmBetsModal = false;
    showWheelOverlay = false;
    showResultFlash = false;
    showSummaryModal = false;
    wheelFadeOut = false;
    boardHidden = false;
    isSpinning = false;
    betsLocked = false;
    setSpinTransitions(0, spinEasing, ballEasing);
    wheelAngle = 0;
    ballAngle = 0;
    winningNumber = null;
    winningColor = 'green';
    clearAllBets();
  }

  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function clearLongPressTimer(key: string): void {
    const timer = longPressTimers.get(key);
    if (timer) clearTimeout(timer);
    longPressTimers.delete(key);
  }

  function clearAllLongPressTimers(): void {
    for (const timer of longPressTimers.values()) clearTimeout(timer);
    longPressTimers.clear();
    suppressTapForKeys.clear();
  }

  function setSpinTransitions(
    durationMs: number,
    nextWheelEasing: string,
    nextBallEasing: string
  ): void {
    wheelTransitionDurationMs = durationMs;
    ballTransitionDurationMs = durationMs;
    wheelTransitionEasing = nextWheelEasing;
    ballTransitionEasing = nextBallEasing;
  }

  function getFinalWheelAngle(number: number): number {
    const mappedAngle = pocketAngles[number] ?? 0;
    return normalizeAngle(360 - mappedAngle);
  }

  function normalizeAngle(angle: number): number {
    const normalized = angle % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  }

  function randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
</script>

{#if open}
  <div class="roulette-shell">
    <button class="roulette-backdrop" aria-label="Close roulette" on:click={closeModal}></button>
    <section class="roulette-modal" role="dialog" aria-modal="true" aria-label="Roulette">
      <header class="roulette-header">
        <h2>Roulette</h2>
        <button class="close-btn" on:click={closeModal} disabled={isSpinning}>Close</button>
      </header>

      <div class="action-row">
        <div class="chip-selector" class:shake={shakeChips}>
          {#each BET_OPTIONS as option}
            <button class="chip-option {betAmount === option ? 'active' : ''}" disabled={placementLocked || option > maxBet} on:click={() => (betAmount = option)}>
              {formatNumber(option)}
            </button>
          {/each}
        </div>
        <div class="bet-stats">
          <div>Total wagered: {formatNumber(totalBet)}</div>
          <div>Max allowed: {formatNumber(maxBet)}</div>
        </div>
      </div>

      <div class="roulette-board" class:board-hidden={boardHidden} class:shake-chip-stacks={shakeChips}>
        <button
          class="zero-zone {resultClass('straight', zeroStraightNumbers)} {pulseWinningNumber && lastWinningNumber === 0 ? 'winning-pocket-pulse' : ''}"
          disabled={placementLocked}
          on:click={() => handleBetTap('straight', zeroStraightNumbers)}
          on:contextmenu={(event) => onBetContextMenu(event, 'straight', zeroStraightNumbers)}
          on:pointerdown={() => handleBetPressStart('straight', zeroStraightNumbers)}
          on:pointerup={() => handleBetPressEnd('straight', zeroStraightNumbers)}
          on:pointerleave={() => handleBetPressEnd('straight', zeroStraightNumbers)}
          on:pointercancel={() => handleBetPressEnd('straight', zeroStraightNumbers)}
        >
          0
          <div class="bet-chip-anchor zero-anchor">
            {#each getChipsFor('straight', zeroStraightNumbers) as chipValue, chipIndex (chipIndex)}
              <RouletteChip value={chipValue} depth={chipIndex} />
            {/each}
          </div>
        </button>

        <div class="section-title">1-18</div>
        <RouletteRows
          rowStart={TOP_ROW_START}
          rowCount={SECTION_ROW_COUNT}
          {placementLocked}
          {pulseWinningNumber}
          {lastWinningNumber}
          {getChipsFor}
          {resultClass}
          {handleBetTap}
          {handleBetRemove}
          {handleBetPressStart}
          {handleBetPressEnd}
        />

        <div class="section-title">19-36</div>
        <div class="bottom-scroll" on:wheel|stopPropagation on:touchmove|stopPropagation>
          <RouletteRows
            rowStart={BOTTOM_ROW_START}
            rowCount={SECTION_ROW_COUNT}
            {placementLocked}
            {pulseWinningNumber}
            {lastWinningNumber}
            {getChipsFor}
            {resultClass}
            {handleBetTap}
            {handleBetRemove}
            {handleBetPressStart}
            {handleBetPressEnd}
          />
        </div>

        <!-- Even Chances (1:1) - Prominent top row -->
        <div class="outside-section-title">EVEN CHANCE</div>
        <div class="outside-grid even-chance-grid">
          {#each evenChanceEntries as evenChance}
            {@const outsideChips = getChipsFor(evenChance.type, evenChance.numbers)}
            <button
              class="outside-btn even-chance-btn {resultClass(evenChance.type, evenChance.numbers)}"
              disabled={placementLocked}
              on:click={() => handleBetTap(evenChance.type, evenChance.numbers)}
              on:contextmenu={(event) => onBetContextMenu(event, evenChance.type, evenChance.numbers)}
              on:pointerdown={() => handleBetPressStart(evenChance.type, evenChance.numbers)}
              on:pointerup={() => handleBetPressEnd(evenChance.type, evenChance.numbers)}
              on:pointerleave={() => handleBetPressEnd(evenChance.type, evenChance.numbers)}
              on:pointercancel={() => handleBetPressEnd(evenChance.type, evenChance.numbers)}
            >
              {evenChance.label}
              <div class="bet-chip-anchor outside-anchor">
                {#each outsideChips as chipValue, chipIndex (chipIndex)}
                  <RouletteChip value={chipValue} depth={chipIndex} />
                {/each}
              </div>
            </button>
          {/each}
        </div>

        <!-- Dozens (2:1) -->
        <div class="outside-section-title">DOZENS</div>
        <div class="outside-grid dozens-grid">
          {#each dozenEntries as dozen}
            {@const outsideChips = getChipsFor(dozen.type, dozen.numbers)}
            <button
              class="outside-btn {resultClass(dozen.type, dozen.numbers)}"
              disabled={placementLocked}
              on:click={() => handleBetTap(dozen.type, dozen.numbers)}
              on:contextmenu={(event) => onBetContextMenu(event, dozen.type, dozen.numbers)}
              on:pointerdown={() => handleBetPressStart(dozen.type, dozen.numbers)}
              on:pointerup={() => handleBetPressEnd(dozen.type, dozen.numbers)}
              on:pointerleave={() => handleBetPressEnd(dozen.type, dozen.numbers)}
              on:pointercancel={() => handleBetPressEnd(dozen.type, dozen.numbers)}
            >
              {dozen.label}
              <div class="bet-chip-anchor outside-anchor">
                {#each outsideChips as chipValue, chipIndex (chipIndex)}
                  <RouletteChip value={chipValue} depth={chipIndex} />
                {/each}
              </div>
            </button>
          {/each}
        </div>

        <!-- Columns (2:1) -->
        <div class="outside-grid columns-grid">
          <div class="column-spacer"></div>
          {#each columnEntries as column}
            {@const outsideChips = getChipsFor(column.type, column.numbers)}
            <button
              class="outside-btn column-btn {resultClass(column.type, column.numbers)}"
              disabled={placementLocked}
              on:click={() => handleBetTap(column.type, column.numbers)}
              on:contextmenu={(event) => onBetContextMenu(event, column.type, column.numbers)}
              on:pointerdown={() => handleBetPressStart(column.type, column.numbers)}
              on:pointerup={() => handleBetPressEnd(column.type, column.numbers)}
              on:pointerleave={() => handleBetPressEnd(column.type, column.numbers)}
              on:pointercancel={() => handleBetPressEnd(column.type, column.numbers)}
            >
              {column.label}
              <div class="bet-chip-anchor outside-anchor">
                {#each outsideChips as chipValue, chipIndex (chipIndex)}
                  <RouletteChip value={chipValue} depth={chipIndex} />
                {/each}
              </div>
            </button>
          {/each}
        </div>
      </div>

      <div class="footer"><button class="primary-btn" disabled={isSpinning || totalBet <= 0} on:click={openConfirmBets}>PLACE YOUR BETS</button></div>
    </section>

    {#if showWheelOverlay}
      <div class="wheel-overlay {wheelFadeOut ? 'fade-out' : ''}">
        <div class="wheel-wrap">
          <div
            class="wheel"
            style={`--wheelAngle:${wheelAngle}deg; --wheelTransitionDuration:${wheelTransitionDurationMs}ms; --wheelTransitionEasing:${wheelTransitionEasing};`}
          >
            {#each EUROPEAN_WHEEL_ORDER as pocket, i}
              <div
                class="wheel-pocket {getRouletteColor(pocket)} {winningNumber === pocket && !isSpinning ? 'wheel-pocket-win' : ''}"
                style={`transform: rotate(${(360 / EUROPEAN_WHEEL_ORDER.length) * i}deg) translateY(-116px);`}
              >
                {pocket}
              </div>
            {/each}
          </div>
          <div
            class="ball-track"
            style={`--ballAngle:${ballAngle}deg; --ballTransitionDuration:${ballTransitionDurationMs}ms; --ballTransitionEasing:${ballTransitionEasing};`}
          ><div class="ball"></div></div>
        </div>
      </div>
    {/if}

    {#if showResultFlash && winningNumber !== null}
      <div class="result-flash {winningColor}"><div class="n">{winningNumber}</div><div>{winningColor.toUpperCase()}</div></div>
    {/if}

    {#if confirmBetsModal}
      <div class="mini-backdrop"><div class="mini-modal"><h3>Total wagered: {formatNumber(totalBet)} chips (Max allowed: {formatNumber(maxBet)})</h3><div class="mini-actions"><button class="primary-btn" on:click={confirmAndSpin}>Confirm Bets</button><button class="secondary-btn" on:click={() => { clearAllBets(); confirmBetsModal = false; }}>Clear All</button></div></div></div>
    {/if}

    {#if showSummaryModal}
      <div class="mini-backdrop"><div class="mini-modal">{#if totalNet > 0}<h3>You won {formatNumber(totalNet)} chips!</h3>{:else}<h3>No luck this time.</h3>{/if}<div class="mini-actions"><button class="primary-btn" on:click={playAgain}>Play Again</button><button class="secondary-btn" on:click={returnToMainScreen}>Return to Main Screen</button></div></div></div>
    {/if}
  </div>
{/if}

<style>
  .roulette-shell { position: fixed; inset: 0; z-index: 70; }
  .roulette-backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.82); border: none; padding: 0; }
  .roulette-modal { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(96vw, 680px); max-height: 94vh; display: flex; flex-direction: column; border: 1px solid #9a7b2f; border-radius: 14px; background: #0f172a; overflow-y: auto; overflow-x: hidden; }
  .roulette-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid #334155; color: #fff; }
  .close-btn, .chip-option, .outside-btn, .primary-btn, .secondary-btn { min-height: 40px; border-radius: 10px; font-size: 12px; font-weight: 800; }
  .close-btn, .chip-option, .outside-btn, .secondary-btn { border: 1px solid #6b7280; background: #111827; color: #f8fafc; }
  .action-row { padding: 10px; border-bottom: 1px solid #1f2937; display: grid; gap: 8px; }
  .chip-selector { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip-selector.shake { animation: shake 220ms ease-in-out; box-shadow: 0 0 0 1px #dc2626 inset; border-radius: 10px; padding: 4px; }
  .chip-option.active { border-color: #facc15; background: #3f2d07; color: #fde68a; }
  .bet-stats { color: #d1d5db; font-size: 11px; display: flex; justify-content: space-between; }
.roulette-board {
    --roulette-cell-size: 62px;
    --roulette-cell-gap: 6px;
    flex: 1;
    overflow: visible;
    padding: 10px;
    transition: opacity 200ms ease;
  }
  .roulette-board.board-hidden { opacity: 0.08; pointer-events: none; }
  .zero-zone {
    position: relative;
    width: 100%;
    min-height: 44px;
    border-radius: 10px;
    border: 1px solid #10b981;
    background: #064e3b;
    color: #fff;
    font-size: 16px;
    font-weight: 900;
    overflow: visible;
  }
  .section-title { margin: 8px 0 6px; font-size: 11px; font-weight: 800; color: #fcd34d; }
  .bottom-scroll {
    height: min(38vh, 320px);
    min-height: 220px;
    overflow-y: auto;
    overflow-x: visible;
    overscroll-behavior: contain;
    touch-action: pan-y;
    padding-bottom: 14px;
    scrollbar-gutter: stable both-edges;
  }
  .outside-grid { margin-top: 10px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .outside-btn {
    position: relative;
    overflow: visible;
  }
  .bet-chip-anchor {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 60;
    overflow: visible;
  }

  .zero-anchor {
    transform: none;
  }

  .outside-anchor {
    transform: translateY(-2px);
  }
  .roulette-board.shake-chip-stacks .bet-chip-anchor {
    animation: shake 220ms ease-in-out;
  }
  .zone-win { box-shadow: inset 0 0 0 1px #22c55e, 0 0 14px rgba(34, 197, 94, 0.42); }
  .zone-lose { opacity: 0.45; }
  .winning-pocket-pulse { animation: pulse 1500ms ease; }
  .footer { padding: 10px 12px 14px; border-top: 1px solid #1f2937; }
  .primary-btn { width: 100%; border: 1px solid #facc15; background: linear-gradient(180deg, #d97706, #b45309); color: #fff7ed; }
  .wheel-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(2, 6, 23, 0.84); z-index: 90; transition: opacity 300ms ease; animation: slideup 260ms ease-out; }
  .wheel-overlay.fade-out { opacity: 0; }
  .wheel-wrap { position: relative; width: 280px; height: 280px; }
  .wheel {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    border: 5px solid #f59e0b;
    background: radial-gradient(circle at 50% 50%, #1f2937 0%, #111827 68%, #030712 100%);
    transition: transform var(--wheelTransitionDuration, 0ms) var(--wheelTransitionEasing, cubic-bezier(0.25, 0.1, 0.25, 1));
    transform: rotate(var(--wheelAngle, 0deg));
  }
  .wheel-pocket { position: absolute; left: 50%; top: 50%; width: 24px; height: 16px; margin-left: -12px; border-radius: 6px; transform-origin: center 116px; text-align: center; font-size: 9px; line-height: 16px; font-weight: 900; color: #f8fafc; }
  .wheel-pocket.red { background: #7f1d1d; }
  .wheel-pocket.black { background: #111827; }
  .wheel-pocket.green { background: #14532d; }
  .wheel-pocket-win { box-shadow: 0 0 14px rgba(250, 204, 21, 0.9); }
  .ball-track {
    position: absolute;
    inset: 16px;
    border-radius: 9999px;
    transition: transform var(--ballTransitionDuration, 0ms) var(--ballTransitionEasing, cubic-bezier(0.1, 0.2, 0.1, 1));
    transform: rotate(var(--ballAngle, 0deg));
  }
  .ball { position: absolute; left: 50%; top: 0; width: 12px; height: 12px; margin-left: -6px; border-radius: 9999px; background: #f8fafc; box-shadow: 0 0 8px rgba(255, 255, 255, 0.7); }
  .result-flash { position: absolute; inset: 0; z-index: 95; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-weight: 900; animation: pulseflash 1000ms ease; }
  .result-flash.red { background: rgba(127, 29, 29, 0.74); }
  .result-flash.black { background: rgba(17, 24, 39, 0.8); }
  .result-flash.green { background: rgba(20, 83, 45, 0.8); }
  .result-flash .n { font-size: 54px; line-height: 1; }
  .mini-backdrop { position: absolute; inset: 0; z-index: 100; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; padding: 12px; }
  .mini-modal { width: min(92vw, 420px); background: #0f172a; border: 1px solid #475569; border-radius: 12px; padding: 14px; color: #f8fafc; }
  .mini-modal h3 { font-size: 15px; font-weight: 800; line-height: 1.3; }
  .mini-actions { margin-top: 12px; display: grid; gap: 8px; }
  @media (max-width: 520px) { .roulette-modal { width: 100vw; height: 100vh; max-height: none; border-radius: 0; } }
  @keyframes shake { 0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)} }
  @keyframes pulseflash { 0%{opacity:0;transform:scale(.94)}50%{opacity:1;transform:scale(1)}100%{opacity:.95;transform:scale(1)} }
  @keyframes pulse { 0%,100%{box-shadow:inset 0 0 0 1px #facc15,0 0 8px rgba(250,204,21,.3)}50%{box-shadow:inset 0 0 0 1px #fde047,0 0 14px rgba(250,204,21,.8)} }
  @keyframes slideup { 0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)} }
</style>
