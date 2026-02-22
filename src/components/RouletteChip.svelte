<script lang="ts">
  import { formatNumber } from '$lib/stores';

  export let value = 100;
  export let depth = 0;

  const CHIP_LIFT_PX = 3;
  const MAX_LIFT_STEPS = 6;

  $: depthOffset = Math.min(Math.max(0, depth), MAX_LIFT_STEPS) * CHIP_LIFT_PX;
  $: chipTone = getChipTone(value);
  $: label = formatChipValue(value);

  function formatChipValue(amount: number): string {
    if (amount >= 1_000_000 && amount % 1_000_000 === 0) return `${amount / 1_000_000}M`;
    if (amount >= 1_000 && amount % 1_000 === 0) return `${amount / 1_000}K`;
    return formatNumber(amount);
  }

  function getChipTone(amount: number): string {
    if (amount >= 50000) return 'tone-black';
    if (amount >= 10000) return 'tone-gold';
    if (amount >= 5000) return 'tone-blue';
    if (amount >= 1000) return 'tone-red';
    if (amount >= 500) return 'tone-green';
    return 'tone-ivory';
  }
</script>

<div class={`roulette-chip ${chipTone}`} style={`--chip-lift:${depthOffset}px; --chip-z:${60 + depth};`}>
  <span>{label}</span>
</div>

<style>
  .roulette-chip {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 34px;
    height: 34px;
    transform: translate(-50%, calc(-50% - var(--chip-lift, 0px)));
    z-index: var(--chip-z, 20);
    border-radius: 9999px;
    border: 2px solid rgba(255, 255, 255, 0.9);
    display: grid;
    place-items: center;
    font-size: 10px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.02em;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.55);
    opacity: 1;
    pointer-events: none;
  }

  .roulette-chip span {
    transform: translateY(0.5px);
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
  }

  .roulette-chip.tone-ivory {
    background: radial-gradient(circle at 30% 30%, #fff8dc, #f3d98e 72%);
    color: #5a3b08;
  }

  .roulette-chip.tone-green {
    background: radial-gradient(circle at 30% 30%, #d9ffe3, #22c55e 72%);
    color: #052e16;
  }

  .roulette-chip.tone-red {
    background: radial-gradient(circle at 30% 30%, #ffd6da, #dc2626 72%);
    color: #fff7f7;
  }

  .roulette-chip.tone-blue {
    background: radial-gradient(circle at 30% 30%, #dbeafe, #2563eb 72%);
    color: #f8fafc;
  }

  .roulette-chip.tone-gold {
    background: radial-gradient(circle at 30% 30%, #fff3c8, #f59e0b 72%);
    color: #78350f;
  }

  .roulette-chip.tone-black {
    background: radial-gradient(circle at 30% 30%, #d1d5db, #111827 72%);
    color: #f8fafc;
  }
</style>
