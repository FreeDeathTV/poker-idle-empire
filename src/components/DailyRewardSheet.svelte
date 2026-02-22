<script lang="ts">
  import { dailyTasks, dailyStreakCount, formatNumber, rouletteUnlocked } from '$lib/stores';
  import { claimDailyReward, getDailyRewardPreview } from '$lib/gameLogic';

  export let inHeader = false;

  const STREAK_MAX = 7;

  $: canClaim =
    !$dailyTasks.rewardClaimed &&
    $dailyTasks.openApp &&
    $dailyTasks.tapCount >= $dailyTasks.tapTarget &&
    $dailyTasks.chaseAceSpin &&
    $dailyTasks.watchAd &&
    (!$rouletteUnlocked || $dailyTasks.rouletteSpin);

  $: preview = getDailyRewardPreview();
  $: streakDay = Math.min(STREAK_MAX, Math.max(0, $dailyStreakCount));
  $: streakMessage =
    streakDay >= STREAK_MAX
      ? 'Day 7/7 - Streak complete!'
      : `Day ${streakDay}/7 - Keep going!`;
  $: showDaySevenConfetti = streakDay >= STREAK_MAX;

  function handleClaim() {
    claimDailyReward();
  }

  function formatCpsBoost(multiplier: number, durationMs: number): string {
    if (multiplier <= 1 || durationMs <= 0) return 'No temporary multiplier';
    const mins = Math.floor(durationMs / 60000);
    return `x${multiplier.toFixed(1)} CPS for ${mins}m`;
  }
</script>

<section class:mb-6={!inHeader} class="rounded-xl border border-gray-700 bg-gray-900 p-3">
  <div class="flex items-center justify-between mb-2">
    <h2 class="text-white font-bold text-sm">Daily Reward Sheet</h2>
    <div class="text-xs text-amber-300 font-semibold">Streak: {streakDay}/7</div>
  </div>

  <div class="streak-callout">
    <span>{streakMessage}</span>
    {#if showDaySevenConfetti}
      <div class="day-seven-confetti" aria-hidden="true">
        <span class="confetti c1"></span>
        <span class="confetti c2"></span>
        <span class="confetti c3"></span>
        <span class="confetti c4"></span>
      </div>
    {/if}
  </div>

  <div class="grid grid-cols-2 gap-2 mt-2">
    <div class="task-box {$dailyTasks.openApp ? 'done' : ''}">
      <span class="task-label">Open App</span>
      {#if $dailyTasks.openApp}<span class="check-chip">&#10003;</span>{/if}
    </div>

    <div class="task-box {$dailyTasks.tapCount >= $dailyTasks.tapTarget ? 'done' : ''}">
      <span class="task-label">Tap {$dailyTasks.tapTarget}</span>
      <span class="task-sub">{$dailyTasks.tapCount}/{$dailyTasks.tapTarget}</span>
      {#if $dailyTasks.tapCount >= $dailyTasks.tapTarget}<span class="check-chip">&#10003;</span>{/if}
    </div>

    <div class="task-box {$dailyTasks.chaseAceSpin ? 'done' : ''}">
      <span class="task-label">Spin Chase the Ace</span>
      {#if $dailyTasks.chaseAceSpin}<span class="check-chip">&#10003;</span>{/if}
    </div>

    <div class="task-box {$dailyTasks.watchAd ? 'done' : ''}">
      <span class="task-label">Watch Ad</span>
      <span class="task-sub">placeholder</span>
      {#if $dailyTasks.watchAd}<span class="check-chip">&#10003;</span>{/if}
    </div>

    {#if $rouletteUnlocked}
      <div class="task-box {$dailyTasks.rouletteSpin ? 'done' : ''}">
        <span class="task-label">Spin Roulette</span>
        {#if $dailyTasks.rouletteSpin}<span class="check-chip">&#10003;</span>{/if}
      </div>
    {/if}
  </div>

  <div class="mt-3 rounded-lg bg-gray-800 border border-gray-700 p-2">
    <div class="text-xs text-gray-300">Next Reward (Day {preview.streakCount})</div>
    <div class="text-xs text-yellow-300 mt-1">+{preview.aceTokens} Ace Tokens</div>
    <div class="text-xs text-green-300">+{formatNumber(preview.chipBoost)} chips</div>
    <div class="text-xs text-cyan-300">{formatCpsBoost(preview.cpsMultiplier, preview.cpsDurationMs)}</div>
  </div>

  <button
    on:click={handleClaim}
    disabled={!canClaim || $dailyTasks.rewardClaimed}
    class="mt-3 w-full py-2 rounded-lg text-sm font-bold border transition-colors {canClaim && !$dailyTasks.rewardClaimed
      ? 'bg-yellow-600 hover:bg-yellow-500 border-yellow-400 text-white'
      : 'bg-gray-800 border-gray-600 text-gray-400 cursor-not-allowed'}"
  >
    {$dailyTasks.rewardClaimed ? 'Reward Claimed' : 'Claim Daily Reward'}
  </button>
</section>

<style>
  .streak-callout {
    position: relative;
    border-radius: 8px;
    border: 1px solid #334155;
    background: linear-gradient(180deg, #1f2937, #111827);
    color: #fde68a;
    font-size: 11px;
    font-weight: 700;
    padding: 6px 8px;
    overflow: hidden;
  }

  .day-seven-confetti {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .confetti {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    opacity: 0;
    animation: confetti-pop 900ms ease-out infinite;
  }

  .confetti.c1 {
    left: 12%;
    top: 20%;
    background: #facc15;
    animation-delay: 0ms;
  }

  .confetti.c2 {
    left: 38%;
    top: 10%;
    background: #4ade80;
    animation-delay: 130ms;
  }

  .confetti.c3 {
    left: 62%;
    top: 28%;
    background: #38bdf8;
    animation-delay: 220ms;
  }

  .confetti.c4 {
    left: 84%;
    top: 14%;
    background: #f87171;
    animation-delay: 330ms;
  }

  .task-box {
    position: relative;
    min-height: 64px;
    border-radius: 10px;
    border: 1px solid #4b5563;
    background: #1f2937;
    padding: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    transition: background-color 180ms ease, border-color 180ms ease, transform 180ms ease;
  }

  .task-box.done {
    background: #0f3d2e;
    border-color: #22c55e;
    transform: translateY(-1px);
  }

  .task-box.done::after {
    content: '';
    position: absolute;
    inset: -40% auto auto -40%;
    width: 70%;
    height: 180%;
    background: linear-gradient(120deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
    transform: rotate(24deg);
    animation: task-shine 720ms ease-out;
    pointer-events: none;
  }

  .task-label {
    color: #f3f4f6;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
  }

  .task-sub {
    color: #9ca3af;
    font-size: 11px;
    margin-top: 2px;
  }

  .check-chip {
    position: absolute;
    right: 8px;
    top: 6px;
    width: 18px;
    height: 18px;
    border-radius: 9999px;
    border: 1px solid #22c55e;
    background: radial-gradient(circle at 30% 30%, #86efac, #16a34a);
    color: #052e16;
    font-size: 11px;
    line-height: 16px;
    text-align: center;
    font-weight: 900;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    animation: chip-drop 240ms ease-out;
  }

  @keyframes chip-drop {
    0% {
      transform: translateY(-14px) rotateX(85deg) scale(0.84);
      opacity: 0.25;
    }
    100% {
      transform: translateY(0) rotateX(0deg) scale(1);
      opacity: 1;
    }
  }

  @keyframes task-shine {
    0% {
      transform: translateX(-20%) rotate(24deg);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    100% {
      transform: translateX(180%) rotate(24deg);
      opacity: 0;
    }
  }

  @keyframes confetti-pop {
    0% {
      transform: translateY(0) scale(0.7);
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    100% {
      transform: translateY(-12px) scale(1);
      opacity: 0;
    }
  }
</style>
