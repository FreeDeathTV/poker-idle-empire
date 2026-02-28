<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import {
    chips,
    cps,
    aceTokens,
    buildings,
    adState,
    thUnlocked,
    tapMultiplier,
    formatNumber,
    v2BuildingLevels,
    prestigePoints,
    signingBonusTotal,
    initializeDebugMode,
    debugEnabled,
    slotsUnlocked,
    setChaseAceUnlocked,
    openChaseAce,
    autoTapperUnlocked,
    autoTapperEnabled,
    currentThemeIndex,
    chaseAceState,
    personalityToasts,
    rouletteUnlocked,
    crapsRushState,
    crapsRushDiscountActive,
    crapsRushRemainingMinutes,
    setCrapsRushUnlocked,
    openCrapsRush,
    tickCrapsRushTimer,
    resetFlowActive
  } from '$lib/stores';
  import ChipOdometer from '../../components/ChipOdometer.svelte';
  import {
    loadGame,
    updateIdle,
    dealHand,
    startAdWatch,
    saveGame,
    startAutoSave,
    stopAutoSave,
    openBonus,
    getAdCooldown,
    formatCooldown,
    canReset,
    performReset,
    startResetFlow,
    markDailyOpenApp,
    recordDailyTap,
    markDailyChaseAceSpin,
    markDailyRouletteSpin,
    setTurboTapperEnabled,
    syncThemeFromProgress
  } from '$lib/gameLogic';
  import { BUILDINGS, isUnlocked, levelCost, prestigeMultiplier, signingBonus, type BuildingId } from '$lib/v2';
  import { CHASE_ACE_CARD_SHUFFLERS_UNLOCK_LEVEL } from '$lib/chaseAceConfig';
  import type { AdType } from '$lib/stores';
  import { blackjackState, blackjackUnlocked } from '$lib/sponsorsBlackjack';
  import BonusModal from '../../components/BonusModal.svelte';
  import AdWatcher from '../../components/AdWatcher.svelte';
  import Building from '../../components/Building.svelte';
  import BuildingMeter from '../../components/BuildingMeter.svelte';
  import EmpireSlotsModal from '../../components/EmpireSlotsModal.svelte';
  import ChaseAceModal from '../../components/ChaseAceModal.svelte';
  import Roulette from '../../components/Roulette.svelte';
  import DailyRewardSheet from '../../components/DailyRewardSheet.svelte';
  import Instructions from '../../components/Instructions.svelte';
  import ResetFlow from '../../components/ResetFlow.svelte';
  import DebugSuite from '../../components/DebugSuite.svelte';
  import InstallPrompt from '../../components/InstallPrompt.svelte';
  import BlackjackSpotlight from '../../components/BlackjackSpotlight.svelte';
  import CrapsRush from '../../components/CrapsRush.svelte';


  let interval: ReturnType<typeof setInterval>;
  let offlineEarnings = 0;
  let showOfflineModal = false;
  let showInstructions = false;
  let showDebug = false;
  let showEmpireSlots = false;
  let showRoulette = false;
  let showDailySheet = false;
  let chaseAceUnlockedByBuilding = false;
  let themeClass = 'theme-garage';
  let previousTurboUnlocked = false;
  let turboToastReady = false;
  let chaseHookReady = false;
  let lastChaseResolvedAt = 0;
  let toasts: { id: number; text: string }[] = [];
  let unlockSeen: Record<string, boolean> = {};
  let boostersOpen = false;
  let chipBump = false;
  let lastChipsValue = 0;
  let floatingNumbers: { id: number; symbol: string; x: number; y: number }[] = [];
  let appToastHandler: ((event: Event) => void) | null = null;
  
  // Header micro-animations (V204)
  let mascotBlink = false;
  let ppPulse = false;
  let chipSparkle = false;
  let mascotTilt = false;
  
  // Mascot blink every 8-12 seconds
  onMount(() => {
    const scheduleBlink = () => {
      const delay = 8000 + Math.random() * 4000;
      setTimeout(() => {
        mascotBlink = true;
        setTimeout(() => {
          mascotBlink = false;
          scheduleBlink();
        }, 150);
      }, delay);
    };
    scheduleBlink();
  });
  
  // Detect big gains for sparkle (10%+ increase)
  $: if (lastChipsValue > 0 && $chips > lastChipsValue) {
    const percentGain = (($chips - lastChipsValue) / lastChipsValue) * 100;
    if (percentGain >= 10) {
      chipSparkle = true;
      setTimeout(() => chipSparkle = false, 600);
    }
  }
  
  function handleMascotTap() {
    mascotTilt = true;
    setTimeout(() => mascotTilt = false, 200);
  }
  
  function handleDealClick(event: MouseEvent | TouchEvent) {
    const symbols = ['£', '$', '€'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    let clientX: number, clientY: number;
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const id = Date.now() + Math.random();
    floatingNumbers = [...floatingNumbers, { id, symbol, x: clientX, y: clientY }];
    
    setTimeout(() => {
      floatingNumbers = floatingNumbers.filter(n => n.id !== id);
    }, 1000);
    
    dealHand();
    recordDailyTap(1);
  }
  
  let isPremiumHand = false;

  function pushToast(text: string) {
    const id = Date.now() + Math.random();
    toasts = [...toasts, { id, text }];
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
    }, 2500);
  }

  function getThemeClass(index: number): string {
    switch (index) {
      case 1: return 'theme-casino';
      case 2: return 'theme-highroller';
      case 3: return 'theme-vip';
      case 4: return 'theme-backalley';
      default: return 'theme-garage';
    }
  }

  function toggleTurboTapper() {
    setTurboTapperEnabled(!$autoTapperEnabled);
  }

  $: if ($prestigePoints === 1) {
    try {
      const flag = localStorage.getItem('poker_idle_first_prestige_toast');
      if (flag !== '1') {
        pushToast('First Prestige! Multiplier unlocked.');
        localStorage.setItem('poker_idle_first_prestige_toast', '1');
      }
    } catch {}
  }

  $: if (!$slotsUnlocked && ($v2BuildingLevels.ProDealers || 0) >= 1) {
    slotsUnlocked.set(true);
    pushToast('Your empire expands! Empire Slots unlocked 🎰');
    saveGame();
  }

  $: chaseAceUnlockedByBuilding = ($v2BuildingLevels.CardShufflers || 0) >= CHASE_ACE_CARD_SHUFFLERS_UNLOCK_LEVEL;
  $: setChaseAceUnlocked(chaseAceUnlockedByBuilding);

  $: crapsRushUnlockedByBuilding = ($v2BuildingLevels.BuildingExpansion || 0) >= 1;
  $: setCrapsRushUnlocked(crapsRushUnlockedByBuilding);

  $: if ($v2BuildingLevels) {
    syncThemeFromProgress();
  }
  $: themeClass = getThemeClass($currentThemeIndex);
  $: if (turboToastReady) {
    if (!previousTurboUnlocked && $autoTapperUnlocked) {
      pushToast('Turbo Tapper activated - 2 taps/sec.');
    }
    previousTurboUnlocked = $autoTapperUnlocked;
  }
  $: if (
    chaseHookReady &&
    $chaseAceState.phase === 'result' &&
    $chaseAceState.lastResolvedAt > 0 &&
    $chaseAceState.lastResolvedAt !== lastChaseResolvedAt
  ) {
    lastChaseResolvedAt = $chaseAceState.lastResolvedAt;
    markDailyChaseAceSpin();
  }
  $: if (!$rouletteUnlocked) {
    showRoulette = false;
  }

  onMount(() => {
    loadGame();
    markDailyOpenApp();
    initializeDebugMode();
    startAutoSave();
    previousTurboUnlocked = $autoTapperUnlocked;
    turboToastReady = true;
    lastChaseResolvedAt = $chaseAceState.lastResolvedAt;
    chaseHookReady = true;
    appToastHandler = (event: Event) => {
      const detail = (event as CustomEvent<{ text?: string }>).detail;
      if (!detail?.text) return;
      pushToast(detail.text);
    };
    window.addEventListener('appToast', appToastHandler);
    try {
      const seen = localStorage.getItem('poker_idle_instructions_seen');
      if (seen !== '1') showInstructions = true;
    } catch {}
    try {
      if (typeof location !== 'undefined' && location.search.includes('debug=1')) {
        showDebug = true;
      }
    } catch {}

    for (const b of BUILDINGS) {
      const unlocked = isUnlocked(b.id, $v2BuildingLevels, tableCount);
      unlockSeen[b.id] = unlocked;
    }
    setInterval(() => {
      for (const b of BUILDINGS) {
        const unlocked = isUnlocked(b.id, $v2BuildingLevels, tableCount);
        if (unlocked && !unlockSeen[b.id]) {
          unlockSeen[b.id] = true;
          pushToast(`${b.name} unlocked!`);
        }
      }
    }, 1500);
    
    interval = setInterval(updateIdle, 1000);
    
    const lastSave = localStorage.getItem('poker_idle_save');
    if (lastSave) {
      try {
        const data = JSON.parse(lastSave);
        if (data.lastTime && $cps > 0) {
          const now = Date.now();
          const offlineSeconds = (now - data.lastTime) / 1000;
          if (offlineSeconds > 60) {
            offlineEarnings = Math.floor($cps * offlineSeconds);
            if (offlineEarnings > 0) {
              showOfflineModal = true;
            }
          }
        }
      } catch {}
    }
  });

  onDestroy(() => {
    stopAutoSave();
    if (interval) clearInterval(interval);
    if (appToastHandler) {
      window.removeEventListener('appToast', appToastHandler);
      appToastHandler = null;
    }
    saveGame();
  });

  $: expansionDiscountMultiplier = $crapsRushDiscountActive ? 0.5 : 1;

  function handleAdClick(type: AdType) {
    startAdWatch(type);
  }

  const adTypes: AdType[] = ['doubleTap', 'extraTable', 'unlockTH'];

  function getAdButtonInfo(type: AdType) {
    const info: Record<AdType, { emoji: string; title: string; description: string }> = {
      doubleTap: { emoji: '\u26A1', title: '2x Tap', description: '5 min' },
      extraTable: { emoji: '\uD83C\uDCCF', title: '+1 Table', description: 'Instant' },
      unlockTH: { emoji: '\uD83C\uDFB0', title: 'Unlock Bonus', description: 'Permanent' }
    };
    return info[type];
  }

  function closeOfflineModal() {
    showOfflineModal = false;
  }

  $: tableCount = $buildings?.[0]?.count || 0;
  $: tableTier = tableCount >= 200 ? 'tier-4' : tableCount >= 100 ? 'tier-3' : tableCount >= 50 ? 'tier-2' : tableCount >= 10 ? 'tier-1' : '';
  $: {
    if ($chips > lastChipsValue) {
      chipBump = true;
      setTimeout(() => (chipBump = false), 250);
    }
    lastChipsValue = $chips;
  }

  function getBuildingMeterIcon(id: BuildingId): 'ProDealers' | 'CardShufflers' | 'TDs' | 'Sponsors' | 'BuildingExpansion' {
    switch (id) {
      case 'ProDealers': return 'ProDealers';
      case 'CardShufflers': return 'CardShufflers';
      case 'TDs': return 'TDs';
      case 'Sponsors': return 'Sponsors';
      case 'BuildingExpansion': return 'BuildingExpansion';
      default: return 'ProDealers';
    }
  }

  // AdMob bonus upgrade functionality for Pro Dealers
  let proDealersAdCooldown = 0;
  let proDealersDailyCount = 0;
  let proDealersAdTimer: ReturnType<typeof setInterval> | null = null;

  $: if (proDealersAdCooldown > 0) {
    proDealersAdTimer = setInterval(() => {
      proDealersAdCooldown = Math.max(0, proDealersAdCooldown - 1);
      if (proDealersAdCooldown === 0 && proDealersAdTimer) {
        clearInterval(proDealersAdTimer);
        proDealersAdTimer = null;
      }
    }, 1000);
  }

  function handleProDealersAdUpgrade() {
    if (proDealersAdCooldown > 0 || proDealersDailyCount >= 6) return;
    
    // Start AdMob video ad
    startAdWatch('extraTable'); // Using existing ad type for simplicity
    
    // Handle ad completion callback
    const handleAdComplete = () => {
      // Add 1 Pro Dealers building
      const currentLevel = $v2BuildingLevels.ProDealers || 0;
      v2BuildingLevels.set({ ...$v2BuildingLevels, ProDealers: currentLevel + 1 });
      proDealersDailyCount++;
      proDealersAdCooldown = 300; // 5 minute cooldown
      pushToast('+1 Pro Dealers from Ad!');
      saveGame();
      
      // Clean up listener
      window.removeEventListener('adComplete', handleAdComplete as EventListener);
    };
    
    window.addEventListener('adComplete', handleAdComplete as EventListener);
  }

  function getProDealersAdStatus() {
    if (proDealersDailyCount >= 6) {
      return { text: 'Daily limit reached', disabled: true };
    }
    if (proDealersAdCooldown > 0) {
      const minutes = Math.floor(proDealersAdCooldown / 60);
      const seconds = proDealersAdCooldown % 60;
      return { 
        text: `Cooldown: ${minutes}:${seconds.toString().padStart(2, '0')}`, 
        disabled: true 
      };
    }
    return { text: `Watch Ad (+1) - ${proDealersDailyCount}/6`, disabled: false };
  }
</script>

{#if showOfflineModal}
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-800 rounded-xl p-6 max-w-sm w-full text-center border-2 border-yellow-500">
      <div class="text-4xl mb-4">💤</div>
      <h2 class="text-xl font-bold text-white mb-2">Welcome Back!</h2>
      <p class="text-gray-400 mb-4">While you were away, your tables earned:</p>
      <div class="text-3xl font-bold text-yellow-400 mb-4">+{formatNumber(offlineEarnings)} 🪙</div>
      <button 
        on:click={closeOfflineModal}
        class="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-bold"
      >
        Collect
      </button>
    </div>
  </div>
{/if}

{#if showInstructions}
  <Instructions on:close={() => (showInstructions = false)} />
{/if}

<main class="min-h-screen pb-20 theme-main {themeClass}">
  <header class="sticky top-0 z-40 header-glass">
    <div class="container mx-auto max-w-md">
      <div class="flex items-center justify-between px-3 py-3">
        <button 
          class="flex items-center gap-2 select-none transition-transform duration-100 cursor-pointer"
          class:active:scale-110={true}
          on:click={handleMascotTap}
          style="transform: scale(1) rotate({mascotTilt ? '5deg' : '0deg'})"
        >
          <div class="mascot-container relative" class:blink={mascotBlink}>
            <span class="text-2xl sm:text-3xl drop-shadow-md filter">🃏</span>
          </div>
          <div class="pp-brand" class:pulse={ppPulse || isPremiumHand}>Poker Idle Empire</div>
        </button>
        
        <div class="flex flex-col items-end gap-1">
          <div class="chip-capsule" class:bump={chipBump} class:sparkle={chipSparkle}>
            <span class="mr-1 text-xl relative flex-shrink-0">
              🪙
              {#if chipSparkle}
                <span class="absolute -top-1 -right-1 text-xs animate-ping">✨</span>
              {/if}
            </span>
            <div class="flex flex-col items-start leading-tight">
              <ChipOdometer chips={$chips} cps={$cps} isResetFlow={$resetFlowActive} />
              {#if $cps > 0}
                <span class="text-[10px] text-green-700 font-semibold">+{$cps}/s</span>
              {/if}
            </div>
          </div>
          <button class="ace-token-pill" title="Ace Tokens - Click to open shop" on:click={() => goto('/shop')}>
            <span class="mr-1">🂡</span>
            <span class="font-bold">{formatNumber($aceTokens)}</span>
          </button>
          <button
            class="daily-toggle-btn"
            class:active={showDailySheet}
            on:click={() => { showDailySheet = !showDailySheet; }}
          >
            📅 Daily
          </button>
        </div>
      </div>
    </div>
    <div class="h-px w-full divider-gold"></div>
    {#if showDailySheet}
      <div class="header-daily-panel">
        <div class="container mx-auto px-3 pb-3 max-w-md">
          <DailyRewardSheet inHeader={true} />
        </div>
      </div>
    {/if}
  </header>

  <div class="fixed top-2 left-2 z-50 flex flex-col gap-1">
    <button
      class="text-yellow-400/90 bg-gray-900/70 border border-yellow-600 rounded-full w-9 h-9 flex items-center justify-center active:scale-95 backdrop-blur-sm"
      on:click={() => { showInstructions = true; }}
    >
      ?
    </button>
    <InstallPrompt />
  </div>

  {#if $tapMultiplier > 1}
    <div class="w-full bg-transparent">
      <div class="container mx-auto px-4 pt-2 pb-1 max-w-md">
        <div class="flex justify-center gap-4 text-sm">
          <div class="text-yellow-400 font-bold animate-pulse">
            ⚡ {$tapMultiplier}x TAP!
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div class="container mx-auto p-4 max-w-md">
    <section class="mb-8 relative">
      <div class="table-oval {tableTier}">
        <div class="table-edge"></div>
        <button
          on:click={handleDealClick}
          class="deal-btn"
          class:turbo-active={$autoTapperUnlocked && $autoTapperEnabled}
        >
          <span class="block text-5xl mb-1">🃏</span>
          DEAL
        </button>
        {#if $autoTapperUnlocked}
          <button
            on:click={toggleTurboTapper}
            class="turbo-toggle-btn"
          >
            ⚙️ Turbo Tapper: {$autoTapperEnabled ? 'ON' : 'OFF'}
          </button>
        {/if}
      </div>
      
      {#each floatingNumbers as num (num.id)}
        <div 
          class="fixed pointer-events-none z-50 text-2xl font-bold text-yellow-300 animate-float"
          style="left: {num.x}px; top: {num.y}px;"
        >
          {num.symbol}
        </div>
      {/each}
    </section>
    
    <section class="mb-6">
      <div class="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
        <button
          class="w-full px-3 py-2 flex items-center justify-between bg-gray-800 text-white text-sm"
          on:click={() => boostersOpen = !boostersOpen}
        >
          <div class="flex items-center gap-2">
            <span>🏢</span>
            <span class="font-bold">Buildings</span>
          </div>
          <span class="text-yellow-400">{boostersOpen ? '▲' : '▼'}</span>
        </button>
        {#if boostersOpen}
          <div class="p-2 space-y-2 max-h-72 overflow-y-auto">
            {#each $buildings as building, i}
              <Building {building} index={i} />
            {/each}

            {#if tableCount < 2}
              <div class="text-center py-2">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-700 border border-gray-600 text-gray-300">
                  More buildings unlock at Level 2
                </span>
              </div>
            {/if}

            {#if tableCount >= 2}
              {#each BUILDINGS as b}
                {@const lvl = $v2BuildingLevels[b.id] || 0}
                {@const unlocked = isUnlocked(b.id, $v2BuildingLevels, tableCount)}
                {@const cost = levelCost(b.id, lvl)}
                <div class="p-3 rounded-lg bg-gray-800 border {unlocked && isFinite(cost) && $chips >= cost ? 'border-yellow-500' : 'border-gray-700'}">
                  <div class="flex items-center justify-between gap-3">
                    <div class="font-bold text-white truncate">{b.name}</div>
                    <div class="text-[11px] font-semibold text-green-300 whitespace-nowrap">
                      +{(b.baseBoost * 100).toFixed(0)}% boost/lvl
                    </div>
                  </div>
                  <div class="mt-2 flex items-center justify-between gap-3">
                    <div class="text-sm text-gray-300">
                      Owned: <span class="text-white font-bold">{lvl}</span>
                      {#if !unlocked}
                        <span class="ml-1 text-xs text-gray-500">(Locked)</span>
                      {/if}
                      {#if b.id === 'BuildingExpansion' && $crapsRushDiscountActive}
                        <span class="ml-1 px-1.5 py-0.5 rounded bg-green-600 text-white text-xs font-bold animate-pulse">
                          -{$crapsRushRemainingMinutes}m
                        </span>
                      {/if}
                    </div>
                    <button 
                      disabled={!unlocked || !isFinite(cost) || $chips < cost}
                      on:click={() => {
                        if (!unlocked) return;
                        if (!isFinite(cost)) return;
                        if ($chips < cost) return;
                        const actualCost = b.id === 'BuildingExpansion' && $crapsRushDiscountActive
                          ? Math.floor(cost * expansionDiscountMultiplier)
                          : cost;
                        chips.set($chips - actualCost);
                        v2BuildingLevels.set({ ...$v2BuildingLevels, [b.id]: lvl + 1 });
                        saveGame();
                      }}
                      class="px-3 py-1.5 rounded bg-gray-700 disabled:bg-gray-900 disabled:text-gray-500 text-xs whitespace-nowrap"
                    >{isFinite(cost) ? `Buy: ${formatNumber(cost)}` : 'Config Pending'}</button>
                  </div>
                  {#if lvl > 300}
                    <div class="mt-1 text-[10px] text-red-400">reduced x1/2</div>
                  {:else if lvl > 100}
                    <div class="mt-1 text-[10px] text-orange-400">reduced x1/1.5</div>
                  {/if}
                  <div class="mt-3">
                    <BuildingMeter owned={lvl} icon={getBuildingMeterIcon(b.id)} />
                  </div>
                  {#if b.id === 'ProDealers' && unlocked}
                    <div class="mt-2 pt-2 border-t border-gray-700">
                      <button
                        on:click={handleProDealersAdUpgrade}
                        disabled={getProDealersAdStatus().disabled}
                        class="w-full py-2 px-3 rounded text-xs font-bold transition-colors {getProDealersAdStatus().disabled
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'}"
                      >
                        {getProDealersAdStatus().text}
                      </button>
                    </div>
                  {/if}
                </div>
              {/each}
            {/if}

            <div class="mt-1 text-xs text-gray-400 text-center">Prestige Multiplier: x{prestigeMultiplier($prestigePoints).toFixed(2)}</div>
            {#if $signingBonusTotal > 0}
              <div class="mt-1 text-xs text-amber-400 text-center">Permanent Bonus: +{($signingBonusTotal).toFixed(1)}%</div>
            {/if}
          </div>
        {/if}
      </div>
    </section>

    {#if canReset() || ($debugEnabled && $chips >= 1e12)}
      <section class="mb-6">
        <button
          on:click={() => startResetFlow()}
          class="w-full py-3 bg-red-700 hover:bg-red-600 rounded-lg text-white font-bold border-2 border-red-400"
        >
          Escape & Relocate
        </button>
      </section>
    {/if}

    {#if showDebug}
      <section class="mb-6">
        <div class="p-3 rounded-lg bg-gray-900 border border-gray-700">
          <div class="text-white font-bold mb-2">Debug</div>
          <div class="flex gap-2">
            <button class="px-3 py-2 rounded bg-gray-700 text-white text-xs" on:click={() => { chips.set($chips + 1_000_000); saveGame(); }}>+1.0M chips</button>
            <button class="px-3 py-2 rounded bg-gray-700 text-white text-xs" on:click={() => {
              const next = { ...$v2BuildingLevels };
              for (const b of BUILDINGS) {
                if (isUnlocked(b.id, next, tableCount)) {
                  next[b.id] = (next[b.id] || 0) + 1;
                }
              }
              v2BuildingLevels.set(next);
              saveGame();
            }}>+1 level each</button>
            <button class="px-3 py-2 rounded bg-red-700 text-white text-xs" on:click={() => performReset()}>Force reset</button>
          </div>
        </div>
      </section>
    {/if}

    {#if $thUnlocked}
      <section class="mb-6">
        <button
          on:click={openBonus}
          class="w-full py-4 bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 rounded-xl text-white text-lg font-bold shadow-lg active:scale-95 transition-transform border-4 border-yellow-400"
        >
          <span class="text-3xl block mb-1">🎰</span>
          TEXAS HOLD'EM BONUS
        </button>
      </section>
    {/if}

    {#if $slotsUnlocked}
      <section class="mb-6">
        <button
          on:click={() => { showEmpireSlots = true; }}
          class="w-full py-4 bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 rounded-xl text-white text-lg font-bold shadow-lg active:scale-95 transition-transform border-4 border-yellow-400"
        >
          Empire Slots 🎰
        </button>
      </section>
    {/if}

    {#if chaseAceUnlockedByBuilding}
      <section class="mb-6">
        <button
          on:click={() => { openChaseAce(); }}
          class="w-full py-4 bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 rounded-xl text-white text-lg font-bold shadow-lg active:scale-95 transition-transform border-4 border-yellow-400"
        >
          Chase the Ace
        </button>
      </section>
    {/if}

    {#if $rouletteUnlocked}
      <section class="mb-6">
        <button
          on:click={() => { showRoulette = true; }}
          class="w-full py-4 bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 rounded-xl text-white text-lg font-bold shadow-lg active:scale-95 transition-transform border-4 border-yellow-400"
        >
          Roulette
        </button>
      </section>
    {/if}

    {#if ($v2BuildingLevels.Sponsors || 0) >= 1}
      <section class="mb-6">
        <button
          on:click={() => { blackjackState.openGame(); }}
          class="w-full py-4 bg-gradient-to-b from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 rounded-xl text-white text-lg font-bold shadow-lg active:scale-95 transition-transform border-4 border-purple-400"
        >
          ♠️ Blackjack Spotlight
        </button>
      </section>
    {/if}

    {#if crapsRushUnlockedByBuilding}
      <section class="mb-6">
        <button
          on:click={() => { openCrapsRush(); }}
          class="w-full py-4 bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 rounded-xl text-white text-lg font-bold shadow-lg active:scale-95 transition-transform border-4 border-green-400"
        >
          🎲 Craps Rush
        </button>
      </section>
    {/if}

    <section class="mb-6">
      <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <span>📺</span> Ad Rewards
      </h2>
      <div class="grid grid-cols-3 gap-2">
        {#each adTypes as adType}
          {@const ad = $adState[adType]}
          {@const info = getAdButtonInfo(adType)}
          {@const cooldown = getAdCooldown(adType)}
          {@const isLocked = adType === 'unlockTH' && $thUnlocked}
          <button
            on:click={() => handleAdClick(adType)}
            disabled={!ad.available || isLocked}
            class="p-3 rounded-lg text-center transition-colors {ad.available && !isLocked
              ? 'bg-gray-700 hover:bg-gray-600 border border-yellow-500/50'
              : 'bg-gray-800 border border-gray-700'}"
          >
            <div class="text-2xl mb-1">{info.emoji}</div>
            <div class="text-xs font-bold text-white">{info.title}</div>
            <div class="text-xs {ad.available ? 'text-green-400' : 'text-gray-500'}">
              {isLocked ? 'Unlocked' : (ad.available ? info.description : formatCooldown(cooldown))}
            </div>
          </button>
        {/each}
      </div>
      
      <!-- Google AdSense Bottom Ad -->
      <div class="mt-4 adsense-content-container">
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="ca-pub-4126734833336979"
             data-ad-slot="6188754656"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </section>
  </div>
</main>

<svelte:head>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4126734833336979"
       crossorigin="anonymous"></script>
</svelte:head>

<BonusModal />
<AdWatcher />
<ResetFlow />
<DebugSuite />
{#if showEmpireSlots}
  <EmpireSlotsModal on:close={() => { showEmpireSlots = false; }} />
{/if}
<ChaseAceModal />
<CrapsRush />
<BlackjackSpotlight />
{#if $rouletteUnlocked}
  <Roulette
    open={showRoulette}
    on:close={() => { showRoulette = false; }}
    on:spinComplete={() => { markDailyRouletteSpin(); }}
  />
{/if}

<div class="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[90%] max-w-md">
  {#each $personalityToasts as toast (toast.id)}
    <div class="personality-toast text-center">
      {toast.text}
    </div>
  {/each}
</div>

<div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2 w-[90%] max-w-sm">
  {#each toasts as t (t.id)}
    <div class="bg-gray-900/90 border border-yellow-500 text-yellow-300 rounded-lg px-4 py-2 shadow-lg text-sm text-center">
      {t.text}
    </div>
  {/each}
</div>

<style>
  .table-oval {
    position: relative;
    width: 100%;
    height: 220px;
    border-radius: 9999px;
    background: radial-gradient(120% 80% at 50% 20%, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 50%), radial-gradient(80% 120% at 50% 120%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 60%), linear-gradient(160deg, #0b5a2a, #095223 60%, #083f1a);
    box-shadow: inset 0 2px 8px rgba(255,255,255,0.15), inset 0 -6px 16px rgba(0,0,0,0.45), 0 20px 40px rgba(0,0,0,0.5);
    border: 8px solid rgba(212,175,55,0.85);
  }
  .table-edge {
    position: absolute;
    inset: -18px;
    border-radius: 9999px;
    background: linear-gradient(140deg, #6b3f1d, #4a2c13 40%, #6b3f1d 70%);
    box-shadow: inset 0 2px 6px rgba(255,255,255,0.2), inset 0 -8px 12px rgba(0,0,0,0.6);
    z-index: -1;
  }
  .table-oval.tier-1 { box-shadow: inset 0 2px 8px rgba(255,255,255,0.15), inset 0 -6px 16px rgba(0,0,0,0.45), 0 20px 40px rgba(0,0,0,0.5), 0 0 16px rgba(212,175,55,.25); }
  .table-oval.tier-2 { box-shadow: inset 0 2px 8px rgba(255,255,255,0.15), inset 0 -6px 16px rgba(0,0,0,0.45), 0 20px 40px rgba(0,0,0,0.5), 0 0 22px rgba(212,175,55,.35); }
  .table-oval.tier-3 { box-shadow: inset 0 2px 8px rgba(255,255,255,0.15), inset 0 -6px 16px rgba(0,0,0,0.45), 0 20px 40px rgba(0,0,0,0.5), 0 0 28px rgba(212,175,55,.45); }
  .table-oval.tier-4 { box-shadow: inset 0 2px 8px rgba(255,255,255,0.15), inset 0 -6px 16px rgba(0,0,0,0.45), 0 20px 40px rgba(0,0,0,0.5), 0 0 34px rgba(212,175,55,.55); }
  .deal-btn {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, #ffd766, #e3a81b);
    color: #1b1303;
    font-weight: 800;
    letter-spacing: 1px;
    padding: 18px 28px;
    border-radius: 14px;
    border: 2px solid #74521b;
    box-shadow: 0 8px 18px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.6);
    touch-action: manipulation;
  }
  .deal-btn:active {
    transform: translate(-50%, -50%) scale(0.97);
  }
  .deal-btn.turbo-active {
    animation: turbo-tap-pulse 1.1s ease-in-out infinite;
    box-shadow: 0 8px 18px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.6), 0 0 22px rgba(250, 204, 21, 0.45);
  }
  .turbo-toggle-btn {
    position: absolute;
    right: 12px;
    bottom: 12px;
    border-radius: 9999px;
    border: 1px solid #facc15;
    background: rgba(17, 24, 39, 0.85);
    color: #f8fafc;
    font-size: 11px;
    font-weight: 800;
    padding: 6px 10px;
  }
  .ace-token-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    border: 1px solid #f59e0b;
    background: linear-gradient(180deg, #fff7e0, #ffe39a);
    color: #2b1a02;
    font-size: 11px;
    padding: 4px 10px;
  }
  .daily-toggle-btn {
    border-radius: 9999px;
    border: 1px solid #ca8a04;
    background: linear-gradient(180deg, #fff7d6, #ffe089);
    color: #3b2502;
    font-size: 11px;
    font-weight: 800;
    padding: 6px 10px;
  }
  .daily-toggle-btn.active {
    border-color: #a16207;
    background: linear-gradient(180deg, #fde68a, #fcd34d);
  }
  .header-daily-panel {
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    background: linear-gradient(180deg, rgba(34, 40, 52, 0.96), rgba(15, 23, 42, 0.98));
  }
  .personality-toast {
    margin-bottom: 8px;
    border: 1px solid #f59e0b;
    border-radius: 10px;
    background: rgba(17, 24, 39, 0.92);
    color: #fef08a;
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  .theme-main {
    transition: background 1s ease;
    filter: var(--theme-scene-filter, brightness(1));
  }
  .theme-main::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background: var(--theme-overlay-color, rgba(0, 0, 0, 0));
    opacity: 0.2;
    mix-blend-mode: soft-light;
    z-index: 0;
  }
  .theme-garage {
    --theme-overlay-color: rgba(251, 191, 36, 0.05);
    background: radial-gradient(140% 80% at 50% 0%, rgba(251, 191, 36, 0.10), rgba(0, 0, 0, 0)), linear-gradient(180deg, #0f172a 0%, #111827 55%, #1f2937 100%);
  }
  .theme-casino {
    --theme-overlay-color: rgba(22, 163, 74, 0.08);
    background: radial-gradient(130% 70% at 50% -10%, rgba(250, 204, 21, 0.18), rgba(0, 0, 0, 0)), linear-gradient(180deg, #14532d 0%, #14532d 45%, #1f2937 100%);
  }
  .theme-highroller {
    --theme-overlay-color: rgba(245, 158, 11, 0.10);
    background: radial-gradient(120% 80% at 50% -10%, rgba(245, 158, 11, 0.22), rgba(0, 0, 0, 0)), linear-gradient(180deg, #1f2937 0%, #1e293b 55%, #0f172a 100%);
  }
  .theme-vip {
    --theme-overlay-color: rgba(56, 189, 248, 0.09);
    background: radial-gradient(120% 80% at 50% -10%, rgba(56, 189, 248, 0.20), rgba(0, 0, 0, 0)), linear-gradient(180deg, #0f172a 0%, #0b1f3a 55%, #111827 100%);
  }
  .theme-backalley {
    --theme-overlay-color: rgba(248, 113, 113, 0.09);
    background: radial-gradient(130% 80% at 50% -10%, rgba(248, 113, 113, 0.18), rgba(0, 0, 0, 0)), linear-gradient(180deg, #1f2937 0%, #3f1d2e 55%, #111827 100%);
  }
  .chip-counter { font-variant-numeric: tabular-nums; }
  :global(html), :global(body) { overscroll-behavior-y: none; }
  
  .header-glass {
    background: linear-gradient(180deg, rgba(255,215,0,0.95) 0%, rgba(255,234,128,0.95) 100%);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 40;
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -6px 10px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.2);
    border-bottom: 1px solid rgba(255,255,255,0.3);
  }
  
  .header-glass::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
  }
  
  .divider-gold {
    background: linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0.2), rgba(255,255,255,0.8));
    opacity: 0.6;
  }
  
  .pp-brand {
    font-weight: 900;
    letter-spacing: 0.5px;
    font-size: 0.85rem;
    padding: 4px 8px;
    border-radius: 8px;
    color: #3b2b06;
    background: linear-gradient(180deg, #ffe58f, #ffd54a);
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -2px 3px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.15), 0 0 8px rgba(255,215,0,0.3);
    white-space: nowrap;
  }
  
  @media (min-width: 640px) {
    .pp-brand { font-size: 1rem; }
  }
  
  .pp-brand.pulse { animation: pp-glow 0.8s ease-in-out infinite; }
  
  @keyframes pp-glow {
    0%, 100% { box-shadow: inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -2px 3px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.15), 0 0 8px rgba(255,215,0,0.3); }
    50% { box-shadow: inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -2px 3px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.15), 0 0 16px rgba(255,215,0,0.8), 0 0 24px rgba(255,215,0,0.4); }
  }
  
  .chip-capsule {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 9999px;
    background: linear-gradient(180deg, #ffffff, #ffeaa0);
    color: #1b1303;
    font-weight: 800;
    border: 1px solid #c9a300;
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -3px 5px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.15);
  }
  
  .chip-capsule.bump { animation: chip-bounce 300ms ease; }
  
  @keyframes chip-bounce {
    0% { transform: translateY(0) scale(1); }
    35% { transform: translateY(-2px) scale(1.04); }
    70% { transform: translateY(0) scale(0.98); }
    100% { transform: translateY(0) scale(1); }
  }
  
  .chip-capsule.sparkle { animation: chip-sparkle 600ms ease; }
  
  @keyframes chip-sparkle {
    0% { box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -3px 5px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.15); }
    50% { box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -3px 5px rgba(0,0,0,0.15), 0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,255,255,0.5); }
    100% { box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -3px 5px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.15); }
  }
  
  .mascot-container.blink span { animation: mascot-blink 150ms ease; }
  
  @keyframes mascot-blink {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.1); }
  }
  
  .animate-float {
    animation: float-up 1s ease-out forwards;
    text-shadow: 0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.5);
  }
  
  @keyframes float-up {
    0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -60px) scale(1.2); }
  }

  button, [role="button"] {
    -webkit-user-callout: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  * {
    -webkit-user-select: none;
    user-select: none;
  }

  p, span, div:not([role="button"]) {
    -webkit-user-select: text;
    user-select: text;
  }
  
  .adsense-content-container {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 50px;
  }
  
  .adsense-content-container ins.adsbygoogle {
    max-width: 100%;
    width: 100%;
  }
</style>
