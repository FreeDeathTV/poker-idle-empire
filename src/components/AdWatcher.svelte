<script lang="ts">
  import { onDestroy } from 'svelte';
  import { watchingAd, adState } from '$lib/stores';
  import { grantAdReward, getAdCooldown, formatCooldown } from '$lib/gameLogic';
  import type { AdType } from '$lib/stores';
  import { ADMOB_CONFIG } from '$lib/admobConfig';

  let countdown = 5;
  let interval: ReturnType<typeof setInterval> | null = null;
  let admobReady = false;
  let currentAdType: AdType = 'none';

  // Initialize AdMob
  function initAdMob() {
    if (typeof window === 'undefined') return;
    
    // Load AdMob script
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADMOB_CONFIG.appId.replace('~', '/');
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

    script.onload = () => {
      admobReady = true;
      console.log('AdMob script loaded successfully');
    };

    script.onerror = () => {
      console.warn('AdMob script failed to load, using fallback countdown');
      startCountdown();
    };
  }

  // Watch for ad state changes
  $: if ($watchingAd !== 'none') {
    currentAdType = $watchingAd;
    startAdMobAd();
  }

  function startAdMobAd() {
    if (!admobReady) {
      initAdMob();
      // Fallback to countdown if AdMob not ready
      setTimeout(() => {
        if (!admobReady) {
          startCountdown();
        }
      }, 2000);
      return;
    }

    // Try to show real AdMob ad
    try {
      const adUnitId = ADMOB_CONFIG.adUnits[currentAdType];
      showAdMobInterstitial(adUnitId);
    } catch (e) {
      console.warn('AdMob ad failed, falling back to countdown:', e);
      startCountdown();
    }
  }

  function showAdMobInterstitial(adUnitId: string) {
    if (!window.adsbygoogle) {
      startCountdown();
      return;
    }

    // Create interstitial ad element
    const adContainer = document.createElement('div');
    adContainer.innerHTML = `
      <ins class="adsbygoogle"
           style="display:block; width: 100%; height: 100%;"
           data-ad-client="${ADMOB_CONFIG.appId}"
           data-ad-slot="${adUnitId}"
           data-ad-format="auto"
           data-full-width-responsive="true">
      </ins>
    `;
    
    // Show ad container
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4';
    overlay.appendChild(adContainer);
    document.body.appendChild(overlay);

    // Load the ad
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      
      // Set up ad event listeners
      const checkAdLoaded = setInterval(() => {
        const ad = adContainer.querySelector('ins.adsbygoogle');
        if (ad && ad.innerHTML.trim() !== '') {
          clearInterval(checkAdLoaded);
          // Ad loaded successfully
          setTimeout(() => {
            finishAd();
            overlay.remove();
          }, 5000); // Show ad for 5 seconds minimum
        }
      }, 1000);

      // Fallback timer
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.remove();
        }
        finishAd();
      }, 15000); // Maximum 15 seconds

    } catch (e) {
      console.warn('AdMob interstitial failed:', e);
      overlay.remove();
      startCountdown();
    }
  }

  function startCountdown() {
    countdown = 5;
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        finishAd();
      }
    }, 1000);
  }

  function finishAd() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    if (currentAdType !== 'none') {
      grantAdReward(currentAdType);
    }
  }

  function skipAd() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    finishAd();
  }

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  // Get ad display info
  function getAdInfo(type: AdType) {
    const info: Record<AdType, { title: string; reward: string }> = {
      doubleTap: { title: '2x Tap Multiplier', reward: 'Get 2x chips from tapping for 5 minutes!' },
      extraTable: { title: 'Free Poker Table', reward: 'Get +1 Poker Table instantly!' },
      unlockTH: { title: 'Unlock Texas Hold\'em', reward: 'Unlock the bonus round permanently!' }
    };
    return info[type];
  }

  $: adInfo = $watchingAd !== 'none' ? getAdInfo($watchingAd) : null;
</script>

{#if $watchingAd !== 'none' && adInfo}
  <div class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-800 rounded-xl p-6 max-w-sm w-full text-center border-2 border-yellow-500">
      <!-- Fake ad content -->
      <div class="mb-4">
        <div class="text-6xl mb-4">🎰</div>
        <h2 class="text-xl font-bold text-white mb-2">{adInfo.title}</h2>
        <p class="text-gray-300 text-sm">{adInfo.reward}</p>
      </div>

      <!-- Countdown timer -->
      <div class="mb-6">
        <div class="text-4xl font-bold text-yellow-400 mb-2">{countdown}</div>
        <div class="text-gray-400 text-sm">seconds remaining</div>
        
        <!-- Progress bar -->
        <div class="w-full bg-gray-700 rounded-full h-2 mt-3">
          <div 
            class="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
            style="width: {((5 - countdown) / 5) * 100}%"
          ></div>
        </div>
      </div>

      <!-- Skip button -->
      <button 
        on:click={skipAd}
        class="w-full py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
      >
        Skip Ad →
      </button>
    </div>
  </div>
{/if}
