<script lang="ts">
  type MeterIcon =
    | 'PokerTable'
    | 'ProDealers'
    | 'CardShufflers'
    | 'TDs'
    | 'Sponsors'
    | 'BuildingExpansion'
    | 'Generic';

  type SlotState = 'empty' | 'partial' | 'full';

  interface MeterSlot {
    index: number;
    progress: number;
    state: SlotState;
  }

  const SLOT_COUNT = 10;
  const SLOT_UNITS = 100;
  const MAX_METER_UNITS = SLOT_COUNT * SLOT_UNITS;

  export let owned = 0;
  export let icon: MeterIcon = 'Generic';

  function clampProgress(value: number): number {
    return Math.min(1, Math.max(0, value));
  }

  function getSlotState(progress: number): SlotState {
    if (progress <= 0) return 'empty';
    if (progress >= 1) return 'full';
    return 'partial';
  }

  function createSlots(totalOwned: number): MeterSlot[] {
    const clampedOwned = Math.min(Math.max(0, totalOwned), MAX_METER_UNITS);

    return Array.from({ length: SLOT_COUNT }, (_, index) => {
      const slotMin = index * SLOT_UNITS;
      const progress = clampProgress((clampedOwned - slotMin) / SLOT_UNITS);

      return {
        index,
        progress,
        state: getSlotState(progress)
      };
    });
  }

  $: slots = createSlots(owned);
</script>

<div class="building-meter" aria-hidden="true">
  {#each slots as slot (slot.index)}
    <div class="meter-slot {slot.state}">
      <div class="meter-fill" style="width: {slot.progress * 100}%;" />
      <span class="meter-icon">
        {#if icon === 'PokerTable'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="12" cy="10" rx="8" ry="4"></ellipse>
            <path d="M6 10v4c0 1.8 2.7 3.2 6 3.2s6-1.4 6-3.2v-4"></path>
          </svg>
        {:else if icon === 'ProDealers'}
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12l-3.7-3.7a1.2 1.2 0 0 0-1.7 0L3.8 11a1.2 1.2 0 0 0 .9 2h5.2l1.4 4h1.4l1.4-4h5.2a1.2 1.2 0 0 0 .9-2l-2.8-2.8a1.2 1.2 0 0 0-1.7 0L12 12z"></path>
          </svg>
        {:else if icon === 'CardShufflers'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="7" width="10" height="13" rx="1.5"></rect>
            <rect x="10" y="4" width="10" height="13" rx="1.5"></rect>
          </svg>
        {:else if icon === 'TDs'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="5" width="12" height="15" rx="1.8"></rect>
            <path d="M9 3h6"></path>
            <path d="M9 10h6"></path>
            <path d="M9 14h6"></path>
          </svg>
        {:else if icon === 'Sponsors'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="7"></circle>
            <path d="M9.5 12c0 1.1.9 2 2.5 2s2.5-.9 2.5-2-.9-2-2.5-2-2.5-.9-2.5-2 .9-2 2.5-2 2.5.9 2.5 2"></path>
          </svg>
        {:else if icon === 'BuildingExpansion'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="10" width="5" height="10" rx="1"></rect>
            <rect x="10" y="6" width="5" height="14" rx="1"></rect>
            <rect x="16" y="12" width="4" height="8" rx="1"></rect>
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="5" width="14" height="14" rx="2"></rect>
          </svg>
        {/if}
      </span>
    </div>
  {/each}
</div>

<style>
  .building-meter {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 6px;
  }

  .meter-slot {
    position: relative;
    height: 24px;
    border-radius: 8px;
    border: 1px solid #3b4352;
    background: linear-gradient(180deg, #202838 0%, #151c29 100%);
    overflow: hidden;
    transform-origin: center;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .meter-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: linear-gradient(90deg, #8d5e0f 0%, #d7ab3c 55%, #f5da8b 100%);
    opacity: 0;
    transition: width 130ms ease-out, opacity 130ms ease-out;
  }

  .meter-icon {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    z-index: 1;
  }

  .meter-icon :global(svg) {
    width: 14px;
    height: 14px;
  }

  .meter-slot.empty .meter-icon {
    color: rgba(222, 230, 242, 0.35);
  }

  .meter-slot.partial .meter-fill,
  .meter-slot.full .meter-fill {
    opacity: 0.95;
  }

  .meter-slot.partial .meter-icon {
    color: rgba(255, 249, 231, 0.9);
  }

  .meter-slot.full {
    border-color: #d8b04a;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 0 10px rgba(222, 176, 74, 0.35);
    animation: slot-pop 150ms ease-out, slot-glow 200ms ease-out;
  }

  .meter-slot.full .meter-icon {
    color: #2a1d04;
  }

  @keyframes slot-pop {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes slot-glow {
    0% {
      filter: drop-shadow(0 0 0 rgba(245, 218, 139, 0));
    }
    100% {
      filter: drop-shadow(0 0 8px rgba(245, 218, 139, 0.5));
    }
  }
</style>
