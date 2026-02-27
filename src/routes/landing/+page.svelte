<script lang="ts">
  import { onMount } from 'svelte';
  import LandingPage from '../../components/LandingPage.svelte';
  import { initPwaDetection } from '$lib/pwaStore';
  
  onMount(() => {
    initPwaDetection();
  });
</script>

<LandingPage />
