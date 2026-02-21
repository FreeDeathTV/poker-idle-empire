<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { chips, cps, buildings, adState, thUnlocked, tapMultiplier, watchingAd, formatNumber, v2BuildingLevels, prestigePoints } from '$lib/stores';
  import { loadGame, updateIdle, dealHand, startAdWatch, saveGame, startAutoSave, stopAutoSave, openBonus, getAdCooldown, formatCooldown, canReset, performReset } from '$lib/gameLogic';
  import { BUILDINGS, isUnlocked, levelCost, prestigeMultiplier, signingBonus } from '$lib/v2';
  import type { AdType } from '$lib/stores';
  import BonusModal from '../components/BonusModal.svelte';
  import AdWatcher from '../components/AdWatcher.svelte';
  import Building from '../components/Building.svelte';
  import Instructions from '../components/Instructions.svelte';

  let interval: ReturnType<typeof setInterval> | null = null;
  let offlineEarnings = 0;
  let showOfflineModal = false;
  let showInstructions = false;
  let showResetModal = false;
  let showDebug = false;
  let resetCountdown = 3;
  let resetTimer: ReturnType<typeof setInterval> | null = null;
  let toasts: { id: number; text: string }[] = [];
  let unlockSeen: Record<string, boolean> = {};
  let boostersOpen = false;
  let chipBump = false;
  let lastChipsValue = 0;
  let floatingNumbers: { id: number; value: number; x: number; y: number }[] = [];
  
  // Header micro-animations (V204)
  let mascotBlink = false;
  let ppPulse = false;
  let chipSparkle = false;
  let mascotTilt = false;
  
  // Mascot blink every 8-12 seconds
  onMount(() => {
    const scheduleBlink = () => {
      const delay = 8000 + Math.random() * 4000; // 8-12 seconds
      setTimeout(() => {
        mascotBlink = true;
        setTimeout(() => {
          mascotBlink = false;
          scheduleBlink();
        }, 150); // Blink duration
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
  
  // Handle mascot tap
  function handleMascotTap() {
    mascotTilt = true;
    setTimeout(() => mascotTilt = false, 200);
  }
  
  // Handle deal button click with floating number
  function handleDealClick(event: MouseEvent | TouchEvent) {
    // Calculate chips earned (same logic as dealHand)
    const multi = $tapMultiplier;
    const base = 10 * multi;
    const bonus = Math.floor(Math.random() * 50) + 1;
    const total = base + bonus;
    
    // Add floating number at click position
    let clientX: number, clientY: number;
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const id = Date.now() + Math.random();
    floatingNumbers = [...floatingNumbers, { id, value: total, x: clientX, y: clientY }];
    
    // Remove after animation
    setTimeout(() => {
      floatingNumbers = floatingNumbers.filter(n => n.id !== id);
    }, 1000);
    
    // Also trigger the actual deal
    dealHand();
  }
  
  // Check if current hand is a premium hand (for PP pulse)
  // This would be connected to the poker hand detection in gameLogic
  let isPremiumHand = false;

  function pushToast(text: string) {
    const id = Date.now() + Math.random();
    toasts = [...toasts, { id, text }];
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
    }, 2500);
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

  onMount(() => {
    loadGame();
    startAutoSave();
    try {
      const seen = localStorage.getItem('poker_idle_instructions_seen');
      if (seen !== '1') showInstructions = true;
    } catch {}
    try {
      if (typeof location !== 'undefined' && location.search.includes('debug=1')) {
        showDebug = true;
      }
    } catch {}

    // Initialize unlock seen state
    for (const b of BUILDINGS) {
      const unlocked = isUnlocked(b.id, $v2BuildingLevels, tableCount);
      unlockSeen[b.id] = unlocked;
    }
    // Periodically check unlocks and toast
    setInterval(() => {
      for (const b of BUILDINGS) {
        const unlocked = isUnlocked(b.id, $v2BuildingLevels, tableCount);
        if (unlocked && !unlockSeen[b.id]) {
          unlockSeen[b.id] = true;
          pushToast(`${b.name} unlocked!`);
        }
      }
    }, 1500);
    
    // Start idle loop (1 second)
    interval = setInterval(updateIdle, 1000);
    
    // Check for offline earnings
    const lastSave = localStorage.getItem('poker_idle_save');
    if (lastSave) {
      try {
        const data = JSON.parse(lastSave);
        if (data.lastTime && $cps > 0) {
          const now = Date.now();
          const offlineSeconds = (now - data.lastTime) / 1000;
          if (offlineSeconds > 60) { // Show modal if away for more than 1 minute
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
    saveGame(); // Final save on exit
  });

  // Handle ad button click
  function handleAdClick(type: AdType) {
    startAdWatch(type);
  }

  const adTypes: AdType[] = ['doubleTap', 'extraTable', 'unlockTH'];

  // Get ad button info
  function getAdButtonInfo(type: AdType) {
    const info: Record<AdType, { emoji: string; title: string; description: string }> = {
      doubleTap: { emoji: '⚡', title: '2x Tap', description: '5 min' },
      extraTable: { emoji: '🃏', title: '+1 Table', description: 'Instant' },
      unlockTH: { emoji: '🎰', title: 'Unlock Bonus', description: 'Permanent' }
    };
    return info[type];
  }

  // Close offline modal
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
</script>

<!-- Offline Earnings Modal -->
{#if showOfflineModal}
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-800 rounded-xl p-6 max-w-sm w-full text-center border-2 border-yellow-500">
      <div class="text-4xl mb-4">💤</div>
      <h2 class="text-xl font-bold text-white mb-2">Welcome Back!</h2>
      <p class="text-gray-400 mb-4">While you were away, your tables earned:</p>
      <div class="text-3xl font-bold text-yellow-400 mb-4">+{formatNumber(offlineEarnings)} 🎰</div>
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

<main class="min-h-screen bg-gradient-to-b from-green-900 to-gray-900 pb-20">
  <!-- Premium Header (V204) - Glass Effect + Gold Gradient -->
  <header class="sticky top-0 z-40 header-glass">
    <div class="container mx-auto max-w-md">
      <div class="flex items-center justify-between px-3 py-3">
        <!-- Mascot + PP Brand (Left) -->
        <button 
          class="flex items-center gap-2 select-none transition-transform duration-100 cursor-pointer"
          class:active:scale-110={true}
          on:click={handleMascotTap}
          style="transform: scale(1) rotate({mascotTilt ? '5deg' : '0deg'})"
        >
          <!-- Mascot with blink animation -->
          <div class="mascot-container relative" class:blink={mascotBlink}>
            <span class="text-2xl sm:text-3xl drop-shadow-md filter">🃏</span>
          </div>
          <!-- PP Brand with pulse animation -->
          <div class="pp-brand" class:pulse={ppPulse || isPremiumHand}>Poker Idle Empire</div>
        </button>
        
        <!-- Chip Capsule (Right) - Extended with CPS display -->
        <div class="chip-capsule" class:bump={chipBump} class:sparkle={chipSparkle}>
          <span class="mr-1 text-xl relative flex-shrink-0">
            🪙
            {#if chipSparkle}
              <span class="absolute -top-1 -right-1 text-xs animate-ping">✨</span>
            {/if}
          </span>
          <div class="flex flex-col items-start leading-tight">
            <span class="chip-counter">{formatNumber($chips)}</span>
            {#if $cps > 0}
              <span class="text-[10px] text-green-700 font-semibold">+{$cps}/s</span>
            {/if}
          </div>
        </div>
      </div>
    </div>
    <div class="h-px w-full divider-gold"></div>
  </header>

  <!-- Floating Help button (kept outside header per V204) -->
  <div class="fixed top-2 right-2 z-50">
    <button
      class="text-yellow-400/90 bg-gray-900/70 border border-yellow-600 rounded-full w-9 h-9 flex items-center justify-center active:scale-95 backdrop-blur-sm"
      on:click={() => { showInstructions = true; }}
      aria-label="Help"
      title="How to Play"
    >?</button>
  </div>

  <!-- Tap Multiplier indicator (below header) -->
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
    
    <!-- Poker Table -->
    <section class="mb-8 relative">
      <div class="table-oval {tableTier}">
        <div class="table-edge"></div>
        <button
          on:click={handleDealClick}
          class="deal-btn"
        >
          <span class="block text-5xl mb-1">🃏</span>
          DEAL
        </button>
      </div>
      
      <!-- Floating Numbers -->
      {#each floatingNumbers as num (num.id)}
        <div 
          class="fixed pointer-events-none z-50 text-2xl font-bold text-yellow-300 animate-float"
          style="left: {num.x}px; top: {num.y}px;"
        >
          +{num.value}
        </div>
      {/each}
    </section>

    <!-- Buildings -->
    <section class="mb-6">
      <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <span>🏢</span> Buildings
      </h2>
      {#each $buildings as building, i}
        <Building {building} index={i} />
      {/each}
    </section>

    <!-- Boosters (Collapsible) -->
    <section class="mb-6">
      {#if tableCount < 2}
        <div class="text-center">
          <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-800 border border-gray-700 text-gray-300">
            BOOSTERS unlock at Level 2
          </span>
        </div>
      {:else}
        <div class="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
          <button
            class="w-full px-3 py-2 flex items-center justify-between bg-gray-800 text-white text-sm"
            on:click={() => boostersOpen = !boostersOpen}
            aria-expanded={boostersOpen}
          >
            <div class="flex items-center gap-2">
              <span>🧬</span>
              <span class="font-bold">Boosters</span>
            </div>
            <span class="text-yellow-400">{boostersOpen ? '▲' : '▼'}</span>
          </button>
          {#if boostersOpen}
            <div class="p-2 space-y-2 max-h-72 overflow-y-auto">
              {#each BUILDINGS as b}
                {@const lvl = $v2BuildingLevels[b.id] || 0}
                {@const unlocked = isUnlocked(b.id, $v2BuildingLevels, tableCount)}
                {@const cost = levelCost(b.id, lvl)}
                <div class="p-3 rounded-lg bg-gray-800 border flex items-center justify-between {unlocked && isFinite(cost) && $chips >= cost ? 'border-yellow-500' : 'border-gray-700'}">
                  <div class="text-sm">
                    <div class="font-bold text-white flex items-center gap-2">
                      {#if unlocked}
                        <span class="text-green-400">▲</span>
                      {:else}
                        <span class="text-gray-500">🔒</span>
                      {/if}
                      <span>{b.name}</span>
                    </div>
                    <div class="text-xs text-gray-400">{unlocked ? `Level ${lvl}` : 'Locked'}</div>
                    {#if lvl > 300}
                      <div class="text-[10px] text-red-400 mt-1">reduced ×1/2</div>
                    {:else if lvl > 100}
                      <div class="text-[10px] text-orange-400 mt-1">reduced ×1/1.5</div>
                    {/if}
                  </div>
                  <div class="flex items-center gap-2">
                    <button disabled={!unlocked || !isFinite(cost) || $chips < cost}
                      on:click={() => {
                        if (!unlocked) return;
                        if (!isFinite(cost)) return;
                        if ($chips < cost) return;
                        chips.set($chips - cost);
                        v2BuildingLevels.set({ ...$v2BuildingLevels, [b.id]: lvl + 1 });
                        saveGame();
                      }}
                      class="px-3 py-2 rounded bg-gray-700 disabled:bg-gray-900 disabled:text-gray-500 text-xs"
                    >{isFinite(cost) ? `Buy: ${formatNumber(cost)}` : 'Config Pending'}</button>
                  </div>
                </div>
              {/each}
              <div class="mt-1 text-xs text-gray-400 text-center">Prestige Multiplier: ×{prestigeMultiplier($prestigePoints).toFixed(2)}</div>
            </div>
          {/if}
        </div>
      {/if}
    </section>

    <!-- Reset System -->
    {#if canReset()}
      <section class="mb-6">
        <button
          on:click={() => {
            showResetModal = true;
            resetCountdown = 3;
            if (resetTimer) clearInterval(resetTimer);
            resetTimer = setInterval(() => {
              resetCountdown -= 1;
              if (resetCountdown <= 0 && resetTimer) {
                clearInterval(resetTimer);
                resetTimer = null;
              }
            }, 1000);
          }}
          class="w-full py-3 bg-red-700 hover:bg-red-600 rounded-lg text-white font-bold border-2 border-red-400"
        >
          Reset for Prestige
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
            <button class="px-3 py-2 rounded bg-gray-700 text-white text-xs" on:click={() => { chips.set(1_000_000_000_000); }}>Set 1e12 chips</button>
          </div>
        </div>
      </section>
    {/if}

    <!-- Ad Rewards -->
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
              {isLocked ? '✓ Unlocked' : (ad.available ? info.description : formatCooldown(cooldown))}
            </div>
          </button>
        {/each}
      </div>
    </section>

    <!-- Bonus Round Button (only if unlocked) -->
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

  </div>
</main>

<!-- Modals -->
<BonusModal />
<AdWatcher />
{#if showResetModal}
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 rounded-xl p-6 max-w-sm w-full text-center border-2 border-red-500">
      <h2 class="text-xl font-bold text-white mb-2">Reset for Prestige?</h2>
      <div class="text-left text-sm text-gray-200 mb-4 space-y-1">
        <div>Current prestige: <span class="font-bold">{$prestigePoints}</span></div>
        <div>Current multiplier: <span class="font-bold">×{prestigeMultiplier($prestigePoints).toFixed(2)}</span></div>
        <div>After reset prestige: <span class="font-bold">{$prestigePoints + 1}</span></div>
        <div>New multiplier: <span class="font-bold">×{prestigeMultiplier($prestigePoints + 1).toFixed(2)}</span></div>
        <div>Signing bonus now: <span class="font-bold">{(signingBonus($prestigePoints) * 100).toFixed(1)}%</span></div>
        <div>Signing bonus after: <span class="font-bold">{(signingBonus($prestigePoints + 1) * 100).toFixed(1)}%</span> (cap 50%)</div>
      </div>
      <div class="flex gap-2">
        <button class="flex-1 py-3 rounded bg-gray-700 text-white" on:click={() => showResetModal = false}>Cancel</button>
        <button class="flex-1 py-3 rounded bg-red-700 text-white disabled:bg-red-900 disabled:text-gray-400"
          disabled={resetCountdown > 0}
          on:click={() => { performReset(); showResetModal = false; }}>
          {resetCountdown > 0 ? `Hold ${resetCountdown}s` : 'Confirm Reset'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Toasts -->
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
    background:
      radial-gradient(120% 80% at 50% 20%, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 50%),
      radial-gradient(80% 120% at 50% 120%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 60%),
      linear-gradient(160deg, #0b5a2a, #095223 60%, #083f1a);
    box-shadow:
      inset 0 2px 8px rgba(255,255,255,0.15),
      inset 0 -6px 16px rgba(0,0,0,0.45),
      0 20px 40px rgba(0,0,0,0.5);
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
    box-shadow:
      0 8px 18px rgba(0,0,0,0.4),
      inset 0 2px 0 rgba(255,255,255,0.6);
    transition: transform .1s ease, filter .15s ease;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .deal-btn:active {
    transform: translate(-50%, -50%) scale(0.97);
    filter: brightness(0.95);
  }
  .chip-counter {
    font-variant-numeric: tabular-nums;
  }
  :global(html), :global(body) {
    overscroll-behavior-y: none;
  }
  
  /* Premium Header (V204) - Glass Effect + Gold Gradient */
  .header-glass {
    background: linear-gradient(180deg, rgba(255,215,0,0.95) 0%, rgba(255,234,128,0.95) 100%);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 40;
    box-shadow: 
      inset 0 1px 2px rgba(255,255,255,0.8),
      inset 0 -6px 10px rgba(0,0,0,0.12),
      0 2px 8px rgba(0,0,0,0.2);
    border-bottom: 1px solid rgba(255,255,255,0.3);
  }
  
  /* Top highlight for premium feel */
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
  
  /* PP Brand with premium styling */
  .pp-brand {
    font-weight: 900;
    letter-spacing: 0.5px;
    font-size: 0.85rem;
    line-height: 1.1;
    padding: 4px 8px;
    border-radius: 8px;
    color: #3b2b06;
    background: linear-gradient(180deg, #ffe58f, #ffd54a);
    box-shadow: 
      inset 0 1px 2px rgba(255,255,255,0.7), 
      inset 0 -2px 3px rgba(0,0,0,0.2), 
      0 2px 4px rgba(0,0,0,0.15),
      0 0 8px rgba(255,215,0,0.3);
    text-shadow: 0 1px 0 rgba(255,255,255,0.6);
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  @media (min-width: 640px) {
    .pp-brand {
      font-size: 1rem;
    }
  }
  
  /* PP Pulse animation for premium hands */
  .pp-brand.pulse {
    animation: pp-glow 0.8s ease-in-out infinite;
  }
  
  @keyframes pp-glow {
    0%, 100% { 
      box-shadow: 
        inset 0 1px 2px rgba(255,255,255,0.7), 
        inset 0 -2px 3px rgba(0,0,0,0.2), 
        0 2px 4px rgba(0,0,0,0.15),
        0 0 8px rgba(255,215,0,0.3);
    }
    50% { 
      box-shadow: 
        inset 0 1px 2px rgba(255,255,255,0.7), 
        inset 0 -2px 3px rgba(0,0,0,0.2), 
        0 2px 4px rgba(0,0,0,0.15),
        0 0 16px rgba(255,215,0,0.8),
        0 0 24px rgba(255,215,0,0.4);
    }
  }
  
  /* Chip Capsule with premium styling */
  .chip-capsule {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 9999px;
    background: linear-gradient(180deg, #ffffff, #ffeaa0);
    color: #1b1303;
    font-weight: 800;
    border: 1px solid #c9a300;
    box-shadow: 
      inset 0 1px 2px rgba(255,255,255,0.8), 
      inset 0 -3px 5px rgba(0,0,0,0.15), 
      0 2px 10px rgba(0,0,0,0.15);
    transition: transform .15s ease, box-shadow .15s ease;
    will-change: transform;
  }
  
  /* Bounce on every gain */
  .chip-capsule.bump {
    animation: chip-bounce 300ms ease;
  }
  
  @keyframes chip-bounce {
    0%   { transform: translateY(0) scale(1); }
    35%  { transform: translateY(-2px) scale(1.04); }
    70%  { transform: translateY(0) scale(0.98); }
    100% { transform: translateY(0) scale(1); }
  }
  
  /* Sparkle on +10%+ gains */
  .chip-capsule.sparkle {
    animation: chip-sparkle 600ms ease;
  }
  
  @keyframes chip-sparkle {
    0%   { box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -3px 5px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.15); }
    50%  { box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -3px 5px rgba(0,0,0,0.15), 0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,255,255,0.5); }
    100% { box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -3px 5px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.15); }
  }
  
  /* Mascot blink animation */
  .mascot-container.blink span {
    animation: mascot-blink 150ms ease;
  }
  
  @keyframes mascot-blink {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.1); }
  }
  
  /* Floating number animation */
  .animate-float {
    animation: float-up 1s ease-out forwards;
    text-shadow: 0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.5);
  }
  
  @keyframes float-up {
    0% {
      opacity: 1;
      transform: translate(-50%, 0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -60px) scale(1.2);
    }
  }
</style>
