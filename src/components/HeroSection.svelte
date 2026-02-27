<script lang="ts">
  import { goto } from '$app/navigation';
  import { pwaInstalled } from '$lib/pwaStore';
  import PhoneMockup from './PhoneMockup.svelte';
  
  // Screenshots - actual paths
  const dealScreenPlaceholder = '/screenshots/landing/dealButton.png';
  const buildingListPlaceholder = '/screenshots/landing/bonusGames.png';
  
  let deferredPrompt: any = null;
  let showInstallButton = true;

  // Listen for PWA install prompt
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
    });
    
    window.addEventListener('appinstalled', () => {
      showInstallButton = false;
    });
  }
  
  // Check if already installed
  $: if ($pwaInstalled) {
    showInstallButton = false;
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showInstallButton = false;
    }
    deferredPrompt = null;
  }

  function handlePlayNow() {
    goto('/app');
  }
</script>

<section class="hero">
  <div class="hero-bg">
    <div class="floating-chips">
      <span class="chip chip-1">🪙</span>
      <span class="chip chip-2">🎰</span>
      <span class="chip chip-3">🪙</span>
      <span class="chip chip-4">🎲</span>
    </div>
    <div class="glow glow-1"></div>
    <div class="glow glow-2"></div>
  </div>
  
  <div class="hero-content">
    <!-- Mascot placeholder (left) -->
    <div class="mascot-container">
      <div class="mascot-placeholder">
        <span class="mascot-icon">🃏</span>
      </div>
    </div>
    
    <!-- Center content -->
    <div class="center-content">
      <h1 class="logo">Poker Idle Empire</h1>
      <p class="tagline">
        Build your empire.<br>
        Play casino classics.<br>
        Rule the tables.
      </p>
      
      <div class="hero-buttons">
        <button class="btn btn-primary" on:click={handlePlayNow}>
          Play Now
        </button>
        {#if showInstallButton}
          <button class="btn btn-secondary" on:click={handleInstall}>
            Install App
          </button>
        {/if}
      </div>
    </div>
    
    <!-- Phone mockup (right) -->
    <div class="phone-container">
      <PhoneMockup screenshot={dealScreenPlaceholder} alt="DEAL screen">
        <div class="placeholder-screen">
          <span>🃏</span>
        </div>
      </PhoneMockup>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: linear-gradient(180deg, #2A0F3A 0%, #000000 100%);
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .floating-chips {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .chip {
    position: absolute;
    font-size: 3rem;
    opacity: 0.3;
    animation: float 6s ease-in-out infinite;
  }

  .chip-1 { top: 10%; left: 5%; animation-delay: 0s; }
  .chip-2 { top: 20%; right: 10%; animation-delay: 1s; }
  .chip-3 { bottom: 30%; left: 8%; animation-delay: 2s; }
  .chip-4 { bottom: 15%; right: 5%; animation-delay: 3s; }

  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(10deg); }
  }

  .glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.4;
  }

  .glow-1 {
    width: 300px;
    height: 300px;
    background: #4AC9FF;
    top: -50px;
    left: -50px;
  }

  .glow-2 {
    width: 250px;
    height: 250px;
    background: #FF4AC9;
    bottom: -50px;
    right: -50px;
  }

  .hero-content {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 900px;
    padding: 2rem;
    gap: 2rem;
  }

  .mascot-container {
    flex: 0 0 120px;
  }

  .mascot-placeholder {
    width: 100px;
    height: 100px;
    background: rgba(245, 197, 66, 0.1);
    border: 2px dashed rgba(245, 197, 66, 0.3);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mascot-icon {
    font-size: 3rem;
  }

  .center-content {
    flex: 1;
    text-align: center;
  }

  .logo {
    font-size: 2.5rem;
    font-weight: 900;
    color: #F5C542;
    text-shadow: 0 0 30px rgba(245, 197, 66, 0.5);
    margin-bottom: 1rem;
    letter-spacing: 2px;
  }

  .tagline {
    font-size: 1.25rem;
    color: #ffffff;
    line-height: 1.6;
    margin-bottom: 2rem;
    font-weight: 500;
  }

  .hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .btn-primary {
    background: linear-gradient(180deg, #F5C542, #d4a520);
    color: #1a1a1a;
    box-shadow: 0 4px 20px rgba(245, 197, 66, 0.4);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(245, 197, 66, 0.6);
  }

  .btn-primary:active {
    transform: translateY(0);
  }

  .btn-secondary {
    background: linear-gradient(180deg, #4AC9FF, #2ea8d9);
    color: #1a1a1a;
    box-shadow: 0 4px 20px rgba(74, 201, 255, 0.4);
  }

  .btn-secondary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(74, 201, 255, 0.6);
  }

  .phone-container {
    flex: 0 0 auto;
  }

  .placeholder-screen {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #0a2a1a, #083f1a);
    font-size: 4rem;
  }

  @media (max-width: 768px) {
    .hero-content {
      flex-direction: column;
      text-align: center;
    }

    .mascot-container {
      display: none;
    }

    .logo {
      font-size: 1.8rem;
    }

    .tagline {
      font-size: 1rem;
    }

    .phone-container {
      margin-top: 1rem;
    }
  }
</style>
