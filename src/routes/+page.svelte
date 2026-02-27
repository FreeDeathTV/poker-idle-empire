<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  const SAVE_KEY = 'poker_idle_save';

  onMount(() => {
    // Check for save data
    try {
      const saveData = localStorage.getItem(SAVE_KEY);
      if (saveData) {
        // User has save data - go to full game
        goto('/app');
      } else {
        // No save data - go to landing page
        goto('/landing');
      }
    } catch {
      // If localStorage fails, go to landing
      goto('/landing');
    }
  });
</script>

<div class="min-h-screen bg-black flex items-center justify-center">
  <div class="text-center">
    <div class="text-4xl mb-4">🃏</div>
    <p class="text-yellow-400">Loading...</p>
  </div>
</div>
