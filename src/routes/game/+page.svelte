<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentOpponent } from '$lib/headsUpHoldemStore';
  import HeadsUpHoldemGame from '../../components/HeadsUpHoldemGame.svelte';

  // Check if a current opponent is selected, if not redirect back to shop
  onMount(() => {
    if (!$currentOpponent) {
      goto('/shop');
    }
  });
</script>

<div class="game-page">
  <HeadsUpHoldemGame />
</div>

<style>
  .game-page {
    min-height: 100vh;
    background: #0a0a0a;
  }
</style>