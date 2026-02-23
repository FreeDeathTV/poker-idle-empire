<script lang="ts">
  import RouletteChip from './RouletteChip.svelte';
  import {
    getCornerNumbers,
    getLineNumbers,
    getRouletteColor,
    getSplitHorizontalNumbers,
    getSplitVerticalNumbers,
    getStraightNumbers,
    getStreetNumbers,
    type RouletteBetType
  } from '$lib/rouletteLogic';

  export let rowStart = 0;
  export let rowCount = 6;
  export let placementLocked = false;
  export let pulseWinningNumber = false;
  export let lastWinningNumber: number | null = null;
  export let getChipsFor: (type: RouletteBetType, numbers: number[]) => number[];
  
  export let resultClass: (type: RouletteBetType, numbers: number[]) => string;
  export let handleBetTap: (type: RouletteBetType, numbers: number[]) => void;
  export let handleBetRemove: (type: RouletteBetType, numbers: number[]) => void;
  export let handleBetPressStart: (type: RouletteBetType, numbers: number[]) => void;
  export let handleBetPressEnd: (type: RouletteBetType, numbers: number[]) => void;

  $: rowIndexes = Array.from({ length: rowCount }, (_, index) => rowStart + index);

  function hasNextVisibleRow(rowIndex: number): boolean {
    return rowIndex < rowStart + rowCount - 1;
  }

  function getRow(rowIndex: number): number[] {
    return getStreetNumbers(rowIndex) ?? [];
  }

  function onContextMenu(event: MouseEvent, type: RouletteBetType, numbers: number[]): void {
    event.preventDefault();
    handleBetPressEnd(type, numbers);
    handleBetRemove(type, numbers);
  }
</script>

<div class="section-shell">
  <div class="cloth-layout">
    <div class="numbers-grid" role="group" aria-label={`Roulette rows ${rowStart + 1}-${rowStart + rowCount}`}>
      {#each rowIndexes as rowIndex}
        {@const row = getRow(rowIndex)}
        {#each row as number, colIndex}
          {@const straight = getStraightNumbers(rowIndex, colIndex)}
          {@const splitHorizontal = getSplitHorizontalNumbers(rowIndex, colIndex)}
          {@const splitVertical = hasNextVisibleRow(rowIndex)
            ? getSplitVerticalNumbers(rowIndex, colIndex)
            : null}
          {@const corner = hasNextVisibleRow(rowIndex) ? getCornerNumbers(rowIndex, colIndex) : null}
          {@const straightChips = straight ? getChipsFor('straight', straight) : []}
          {@const splitHorizontalChips = splitHorizontal ? getChipsFor('split', splitHorizontal) : []}
          {@const splitVerticalChips = splitVertical ? getChipsFor('split', splitVertical) : []}
          {@const cornerChips = corner ? getChipsFor('corner', corner) : []}

          <div class="number-cell {getRouletteColor(number)} {pulseWinningNumber && lastWinningNumber === number ? 'winning-pocket-pulse' : ''}">
            {#if straight}
              <button
                class="center-zone {resultClass('straight', straight)}"
                disabled={placementLocked}
                on:click={() => handleBetTap('straight', straight)}
                on:contextmenu={(event) => onContextMenu(event, 'straight', straight)}
                on:pointerdown={() => handleBetPressStart('straight', straight)}
                on:pointerup={() => handleBetPressEnd('straight', straight)}
                on:pointerleave={() => handleBetPressEnd('straight', straight)}
                on:pointercancel={() => handleBetPressEnd('straight', straight)}
              >
                {number}
                <div class="chip-anchor center-anchor">
                  {#each straightChips as chipValue, chipIndex (chipIndex)}
                    <RouletteChip value={chipValue} depth={chipIndex} />
                  {/each}
                </div>
              </button>
            {/if}

            {#if splitHorizontal}
              <button
                class="split-zone split-horizontal {resultClass('split', splitHorizontal)}"
                disabled={placementLocked}
                on:click={() => handleBetTap('split', splitHorizontal)}
                on:contextmenu={(event) => onContextMenu(event, 'split', splitHorizontal)}
                on:pointerdown={() => handleBetPressStart('split', splitHorizontal)}
                on:pointerup={() => handleBetPressEnd('split', splitHorizontal)}
                on:pointerleave={() => handleBetPressEnd('split', splitHorizontal)}
                on:pointercancel={() => handleBetPressEnd('split', splitHorizontal)}
              >
                <div class="chip-anchor split-horizontal-anchor">
                  {#each splitHorizontalChips as chipValue, chipIndex (chipIndex)}
                    <RouletteChip value={chipValue} depth={chipIndex} />
                  {/each}
                </div>
              </button>
            {/if}

            {#if splitVertical}
              <button
                class="split-zone split-vertical {resultClass('split', splitVertical)}"
                disabled={placementLocked}
                on:click={() => handleBetTap('split', splitVertical)}
                on:contextmenu={(event) => onContextMenu(event, 'split', splitVertical)}
                on:pointerdown={() => handleBetPressStart('split', splitVertical)}
                on:pointerup={() => handleBetPressEnd('split', splitVertical)}
                on:pointerleave={() => handleBetPressEnd('split', splitVertical)}
                on:pointercancel={() => handleBetPressEnd('split', splitVertical)}
              >
                <div class="chip-anchor split-vertical-anchor">
                  {#each splitVerticalChips as chipValue, chipIndex (chipIndex)}
                    <RouletteChip value={chipValue} depth={chipIndex} />
                  {/each}
                </div>
              </button>
            {/if}

            {#if corner}
              <button
                class="corner-zone {resultClass('corner', corner)}"
                disabled={placementLocked}
                on:click={() => handleBetTap('corner', corner)}
                on:contextmenu={(event) => onContextMenu(event, 'corner', corner)}
                on:pointerdown={() => handleBetPressStart('corner', corner)}
                on:pointerup={() => handleBetPressEnd('corner', corner)}
                on:pointerleave={() => handleBetPressEnd('corner', corner)}
                on:pointercancel={() => handleBetPressEnd('corner', corner)}
              >
                <div class="chip-anchor corner-anchor">
                  {#each cornerChips as chipValue, chipIndex (chipIndex)}
                    <RouletteChip value={chipValue} depth={chipIndex} />
                  {/each}
                </div>
              </button>
            {/if}
          </div>
        {/each}
      {/each}
    </div>

    <div class="street-grid">
      {#each rowIndexes as rowIndex}
        {@const row = getRow(rowIndex)}
        {@const streetChips = getChipsFor('street', row)}
        <button
          class="street-zone {resultClass('street', row)}"
          disabled={placementLocked}
          on:click={() => handleBetTap('street', row)}
          on:contextmenu={(event) => onContextMenu(event, 'street', row)}
          on:pointerdown={() => handleBetPressStart('street', row)}
          on:pointerup={() => handleBetPressEnd('street', row)}
          on:pointerleave={() => handleBetPressEnd('street', row)}
          on:pointercancel={() => handleBetPressEnd('street', row)}
        >
          Street
          <div class="chip-anchor side-anchor">
            {#each streetChips as chipValue, chipIndex (chipIndex)}
              <RouletteChip value={chipValue} depth={chipIndex} />
            {/each}
          </div>
        </button>
      {/each}
    </div>
  </div>

  <div class="line-grid">
    {#each rowIndexes as rowIndex}
      {@const line = hasNextVisibleRow(rowIndex) ? getLineNumbers(rowIndex) : null}
      {#if line}
        {@const lineChips = getChipsFor('line', line)}
        <button
          class="line-zone {resultClass('line', line)}"
          disabled={placementLocked}
          on:click={() => handleBetTap('line', line)}
          on:contextmenu={(event) => onContextMenu(event, 'line', line)}
          on:pointerdown={() => handleBetPressStart('line', line)}
          on:pointerup={() => handleBetPressEnd('line', line)}
          on:pointerleave={() => handleBetPressEnd('line', line)}
          on:pointercancel={() => handleBetPressEnd('line', line)}
        >
          Line
          <div class="chip-anchor line-anchor">
            {#each lineChips as chipValue, chipIndex (chipIndex)}
              <RouletteChip value={chipValue} depth={chipIndex} />
            {/each}
          </div>
        </button>
      {/if}
    {/each}
  </div>
</div>

<style>
  .section-shell {
    display: grid;
    gap: 6px;
    overflow: visible;
  }

  .cloth-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) clamp(84px, 17vw, 112px);
    gap: 6px;
    overflow: visible;
  }

  .numbers-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(6, var(--roulette-cell-size, 62px));
    gap: var(--roulette-cell-gap, 6px);
    overflow: visible;
  }

  .street-grid {
    display: grid;
    grid-template-rows: repeat(6, var(--roulette-cell-size, 62px));
    gap: var(--roulette-cell-gap, 6px);
    overflow: visible;
  }

  .line-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
    overflow: visible;
  }

  .street-zone,
  .line-zone {
    position: relative;
    min-height: 36px;
    border-radius: 10px;
    border: 1px solid #6b7280;
    background: #1f2937;
    color: #f3f4f6;
    font-size: 11px;
    font-weight: 800;
    overflow: visible;
  }

  .number-cell {
    position: relative;
    border-radius: 10px;
    border: 1px solid #4b5563;
    overflow: visible;
  }

  .number-cell.red {
    background: linear-gradient(180deg, #7f1d1d, #5f1212);
  }

  .number-cell.black {
    background: linear-gradient(180deg, #111827, #030712);
  }

  .number-cell.green {
    background: linear-gradient(180deg, #166534, #14532d);
  }

  .center-zone,
  .split-zone,
  .corner-zone {
    position: absolute;
    border: none;
    background: transparent;
    color: #f9fafb;
    font-weight: 800;
    padding: 0;
    overflow: visible;
  }

  .center-zone {
    inset: 0;
    z-index: 1;
    font-size: 14px;
    line-height: 1;
  }

  .split-zone {
    z-index: 2;
  }

  .split-horizontal {
    right: 0;
    top: 0;
    width: clamp(14px, 18%, 20px);
    height: 100%;
  }

  .split-vertical {
    left: 0;
    bottom: 0;
    width: 100%;
    height: clamp(12px, 22%, 18px);
  }

  .corner-zone {
    right: 0;
    bottom: 0;
    width: clamp(14px, 18%, 20px);
    height: clamp(12px, 22%, 18px);
    z-index: 3;
  }

  .chip-anchor {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 60;
    overflow: visible;
  }

  .center-anchor {
    transform: none;
  }

  .split-horizontal-anchor {
    transform: translateX(14%);
  }

  .split-vertical-anchor {
    transform: translateY(14%);
  }

  .corner-anchor {
    transform: translate(14%, 14%);
  }

  .zone-win {
    box-shadow: inset 0 0 0 1px #22c55e, 0 0 14px rgba(34, 197, 94, 0.42);
  }

  .zone-lose {
    opacity: 0.45;
  }

  .winning-pocket-pulse {
    animation: winning-pocket-pulse 1500ms ease;
  }

  @media (max-width: 560px) {
    .cloth-layout {
      grid-template-columns: minmax(0, 1fr) 82px;
    }

    .line-grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }

  @keyframes winning-pocket-pulse {
    0%,
    100% {
      box-shadow: inset 0 0 0 1px #facc15, 0 0 8px rgba(250, 204, 21, 0.3);
    }

    50% {
      box-shadow: inset 0 0 0 1px #fde047, 0 0 14px rgba(250, 204, 21, 0.8);
    }
  }
</style>
