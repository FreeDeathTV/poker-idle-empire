<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { pwaInstalled } from '$lib/pwaStore';
  import { aceTokens, formatNumber } from '$lib/stores';
  import HeadsUpHoldemLadder from '../../components/HeadsUpHoldemLadder.svelte';

  const shopItems = [
    { id: 'heads-up-holdem', title: 'Heads-Up Hold\'em Ladder', icon: '🃏', comingSoon: false },
    { id: 'cosmetics', title: 'Cosmetics', icon: '✨', comingSoon: true },
    { id: 'daily-deals', title: 'Daily Deals', icon: '🏷️', comingSoon: true },
    { id: 'boosts', title: 'Boosts', icon: '⚡', comingSoon: true },
  ];

  function goBack() {
    goto('/app');
  }

  function handleShopItemClick(item) {
    if (item.id === 'heads-up-holdem') {
      // Dispatch a custom event to open the ladder modal
      window.dispatchEvent(new CustomEvent('open-ladder-modal'));
    }
  }
</script>

<HeadsUpHoldemLadder />

<div class="shop-page">
  <div class="shop-header">
    <button class="back-btn" on:click={goBack}>
      ← Back
    </button>
    <h1 class="shop-title">Ace Token Shop</h1>
  <div class="token-balance">
    <span class="token-icon">🃏</span>
    <span class="token-amount">{$aceTokens}</span>
  </div>
  </div>

  <div class="shop-grid">
    {#each shopItems as item}
      <div class="shop-item" on:click={() => handleShopItemClick(item)} class:clickable={!item.comingSoon}>
        <div class="shop-icon">{item.icon}</div>
        <div class="shop-title">{item.title}</div>
        {#if item.comingSoon}
          <div class="coming-soon-badge">Coming Soon</div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .shop-page {
    min-height: 100vh;
    background: #0a0a0a;
    color: #ffffff;
    padding: 1rem;
  }

  .shop-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: rgba(26, 26, 46, 0.8);
    border-radius: 12px;
    margin-bottom: 2rem;
  }

  .back-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
  }

  .shop-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #F5C542;
  }

  .token-balance {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(245, 197, 66, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 20px;
  }

  .token-icon {
    font-size: 1.5rem;
  }

  .token-amount {
    font-size: 1.25rem;
    font-weight: 700;
    color: #F5C542;
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
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .shop-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  }

  .shop-item.clickable:hover {
    border-color: rgba(245, 197, 66, 0.5);
    background: linear-gradient(145deg, #2a2a4e, #353560);
  }

  .shop-item:active {
    transform: translateY(0);
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

  .shop-item .shop-title {
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

  @media (max-width: 500px) {
    .shop-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
