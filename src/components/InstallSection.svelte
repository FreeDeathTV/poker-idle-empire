<script lang="ts">
  import { onMount } from 'svelte';
  import { pwaInstalled } from '$lib/pwaStore';
  import PhoneMockup from './PhoneMockup.svelte';
  
  const buildingListPlaceholder = '/screenshots/landing/bonusGames.png';
  
  let deferredPrompt: any = null;
  let showInstallButton = true;

  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault();
        deferredPrompt = e;
      });
      
      window.addEventListener('appinstalled', () => {
        showInstallButton = false;
      });
    }
  });
  
  $: if ($pwaInstalled) {
    showInstallButton = false;
  }

  async function handleInstall() {
    console.log('[InstallSection] Install button clicked');
    console.log('[InstallSection] deferredPrompt:', deferredPrompt ? 'available' : 'null');
    if (!deferredPrompt) {
      console.log('[InstallSection] ERROR: deferredPrompt is null');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[InstallSection] Install outcome:', outcome);
    if (outcome === 'accepted') {
      showInstallButton = false;
    }
    deferredPrompt = null;
  }
</script>

{#if showInstallButton}
<section class="install-section">
  <div class="install-bg">
    <div class="floating-chips">
      <span class="chip chip-1">🪙</span>
      <span class="chip chip-2">🎰</span>
      <span class="chip chip-3">🪙</span>
      <span class="chip chip-4">🎲</span>
    </div>
    <div class="sparkles">
      <span class="sparkle s-1">✨</span>
      <span class="sparkle s-2">✨</span>
      <span class="sparkle s-3">✨</span>
    </div>
  </div>
  
  <div class="install-content">
    <div class="phone-wrapper">
      <PhoneMockup screenshot={buildingListPlaceholder} alt="Building List screen">
        <div class="placeholder-screen">
          <span>🏢</span>
        </div>
      </PhoneMockup>
    </div>
    
    <div class="text-content">
      <h2 class="install-title">Install Poker Idle Empire</h2>
      <ul class="features-list">
        <li>⚡ Loads instantly</li>
        <li>📴 Works offline</li>
        <li>💾 Saves your progress</li>
        <li>📱 Fullscreen gameplay</li>
      </ul>
      
      <button class="install-btn" on:click={handleInstall}>
        Install App
      </button>
    </div>
  </div>
</section>
{/if}

<style>
  .install-section {
    position: relative;
    padding: 4rem 1rem;
    background: linear-gradient(180deg, #1a1a2e 0%, #2A0F3A 100%);
    overflow: hidden;
  }

  .install-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .floating-chips {
    position: absolute;
    inset: 0;
  }

  .chip {
    position: absolute;
    font-size: 2.5rem;
    opacity: 0.25;
    animation: float 5s ease-in-out infinite;
  }

  .chip-1 { top: 15%; left: 10%; animation-delay: 0s; }
  .chip-2 { top: 25%; right: 15%; animation-delay: 1s; }
  .chip-3 { bottom: 20%; left: 15%; animation-delay: 2s; }
  .chip-4 { bottom: 30%; right: 10%; animation-delay: 0.5s; }

  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(8deg); }
  }

  .sparkles {
    position: absolute;
    inset: 0;
  }

  .sparkle {
    position: absolute;
    font-size: 1.5rem;
    animation: sparkle 2s ease-in-out infinite;
  }

  .s-1 { top: 20%; left: 20%; animation-delay: 0s; }
  .s-2 { top: 40%; right: 25%; animation-delay: 0.5s; }
  .s-3 { bottom: 25%; left: 30%; animation-delay: 1s; }

  @keyframes sparkle {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.2); }
  }

  .install-content {
    position: relative;
    z-index: 10;
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 3rem;
  }

  .phone-wrapper {
    flex: 0 0 auto;
  }

  .text-content {
    flex: 1;
  }

  .install-title {
    font-size: 2rem;
    font-weight: 900;
    color: #F5C542;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 1.5rem;
    text-shadow: 0 0 20px rgba(245, 197, 66, 0.4);
  }

  .features-list {
    list-style: none;
    padding: 0;
    margin: 0 0 2rem 0;
  }

  .features-list li {
    font-size: 1.1rem;
    color: #e0e0e0;
    margin-bottom: 0.75rem;
    font-weight: 500;
  }

  .install-btn {
    display: inline-block;
    padding: 1rem 2.5rem;
    background: linear-gradient(180deg, #4AC9FF, #2ea8d9);
    color: #1a1a1a;
    font-size: 1.2rem;
    font-weight: 700;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 4px 20px rgba(74, 201, 255, 0.4);
    transition: all 0.2s ease;
  }

  .install-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(74, 201, 255, 0.6);
  }

  .placeholder-screen {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #0a2a1a, #083f1a);
    font-size: 3rem;
  }

  @media (max-width: 700px) {
    .install-content {
      flex-direction: column;
      text-align: center;
    }

    .install-title {
      font-size: 1.5rem;
    }

    .features-list {
      text-align: left;
      display: inline-block;
    }
  }
</style>
