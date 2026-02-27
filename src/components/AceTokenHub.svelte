<script lang="ts">
  import { goto } from '$app/navigation';
  import { pwaInstalled } from '$lib/pwaStore';
  import { aceTokens, formatNumber } from '$lib/stores';
  
  const shopItems = [
    { id: 'cosmetics', title: 'Cosmetics', icon: '✨', comingSoon: true },
    { id: 'daily-deals', title: 'Daily Deals', icon: '🏷️', comingSoon: true },
    { id: 'boosts', title: 'Boosts', icon: '⚡', comingSoon: true },
    { id: 'special', title: 'Special Offers', icon: '🎁', comingSoon: true },
  ];

  function openShop() {
    console.log('[AceTokenHub] Button clicked, navigating to /shop');
    goto('/shop');
  }
</script>

<section class="ace-token-hub">
  <button class="hub-container" on:click={openShop}>
    <div class="hub-header">
      <div class="token-icon">🃏</div>
      <h2 class="hub-title">Ace Token Hub</h2>
    </div>
    
    {#if $pwaInstalled}
      <!-- Show token balance and shop grid when installed -->
      <div class="token-balance">
        <span class="balance-label">Your Balance</span>
        <span class="balance-amount">{$aceTokens} 🃏</span>
      </div>
      
      <div class="shop-grid">
        {#each shopItems as item}
          <div class="shop-item">
            <div class="shop-icon">{item.icon}</div>
            <div class="shop-title">{item.title}</div>
            {#if item.comingSoon}
              <div class="coming-soon-badge">Coming Soon</div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <!-- Show install message when not installed -->
      <div class="install-message">
        <div class="message-icon">📱</div>
        <p class="message-text">Install App to access the Ace Token Shop</p>
      </div>
    {/if}
  </button>
</section>

<style>
  .ace-token-hub {
    padding: 4rem 1rem;
    background: 
      radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 100%),
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(245, 197, 66, 0.03) 10px,
        rgba(245, 197, 66, 0.03) 20px
      );
  }

  .hub-container {
    max-width: 700px;
    margin: 0 auto;
    background: rgba(26, 26, 46, 0.8);
    border-radius: 20px;
    padding: 2rem;
    border: 2px solid rgba(245, 197, 66, 0.3);
    box-shadow: 
      0 0 40px rgba(245, 197, 66, 0.1),
      inset 0 0 60px rgba(0, 0, 0, 0.3);
  }

  .hub-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .token-icon {
    font-size: 4rem;
    margin-bottom: 0.5rem;
    filter: drop-shadow(0 0 20px rgba(245, 197, 66, 0.6));
  }

  .hub-title {
    font-size: 2rem;
    font-weight: 900;
    color: #F5C542;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 0 20px rgba(245, 197, 66, 0.5);
  }

  .token-balance {
    text-align: center;
    padding: 1.5rem;
    background: linear-gradient(180deg, rgba(245, 197, 66, 0.1), rgba(245, 197, 66, 0.05));
    border-radius: 12px;
    border: 1px solid rgba(245, 197, 66, 0.3);
    margin-bottom: 2rem;
  }

  .balance-label {
    display: block;
    font-size: 0.9rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 0.5rem;
  }

  .balance-amount {
    font-size: 2rem;
    font-weight: 900;
    color: #F5C542;
    text-shadow: 0 0 15px rgba(245, 197, 66, 0.5);
  }

  .shop-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .shop-item {
    background: linear-gradient(145deg, #1a1a2e, #252540);
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid rgba(74, 201, 255, 0.2);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
  }

  .shop-item::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgba(74, 201, 255, 0.1), transparent 60%);
    pointer-events: none;
  }

  .shop-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .shop-title {
    font-size: 1rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 0.5rem;
  }

  .coming-soon-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: rgba(255, 74, 201, 0.2);
    border: 1px solid #FF4AC9;
    border-radius: 20px;
    color: #FF4AC9;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .install-message {
    text-align: center;
    padding: 3rem 1rem;
  }

  .message-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .message-text {
    font-size: 1.25rem;
    color: #e0e0e0;
    font-weight: 500;
  }

  @media (max-width: 500px) {
    .shop-grid {
      grid-template-columns: 1fr;
    }
    
    .hub-title {
      font-size: 1.5rem;
    }
  }
</style>
