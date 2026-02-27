<script lang="ts">
  import { onMount } from 'svelte';
  import { pwaInstalled } from '$lib/pwaStore';
  
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
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showInstallButton = false;
    }
    deferredPrompt = null;
  }
</script>

{#if showInstallButton}
<div class="install-banner">
  <div class="banner-content">
    <div class="chip-icon">🪙</div>
    <p class="banner-text">
      Install Poker Idle Empire to save your progress and unlock the Ace Token Shop.
    </p>
    <button class="install-btn" on:click={handleInstall}>
      Install App
    </button>
  </div>
</div>
{/if}

<style>
  .install-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: linear-gradient(180(0,0deg, rgba,0,0.9), rgba(0,0,0,0.95));
    border-top: 2px solid #F5C542;
    padding: 12px 16px;
    animation: slide-up 0.3s ease-out;
  }

  @keyframes slide-up {
    0% {
      transform: translateY(100%);
    }
    100% {
      transform: translateY(0);
    }
  }

  .banner-content {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .chip-icon {
    font-size: 1.5rem;
    animation: chip-spin 2s ease-in-out infinite;
  }

  @keyframes chip-spin {
    0%, 100% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(15deg);
    }
    75% {
      transform: rotate(-15deg);
    }
  }

  .banner-text {
    flex: 1;
    color: #e0e0e0;
    font-size: 0.875rem;
    margin: 0;
  }

  .install-btn {
    padding: 8px 20px;
    background: linear-gradient(180deg, #F5C542, #d4a520);
    color: #1a1a1a;
    font-size: 0.875rem;
    font-weight: 700;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 10px rgba(245, 197, 66, 0.4);
    transition: all 0.2s ease;
  }

  .install-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(245, 197, 66, 0.6);
  }

  @media (max-width: 500px) {
    .banner-content {
      flex-direction: column;
      text-align: center;
    }

    .banner-text {
      font-size: 0.75rem;
    }
  }
</style>
