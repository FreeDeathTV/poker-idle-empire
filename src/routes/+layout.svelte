<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import '../app.css';
	import { initPwaDetection, pwaInstalled } from '$lib/pwaStore';
	
	onMount(() => {
		initPwaDetection();
	});
	
	function goHome() {
		goto('/landing');
	}
	
	$: isGamePage = $page.url.pathname === '/';
	$: isLandingPage = $page.url.pathname === '/landing';
</script>

<div class="app">
	{#if $pwaInstalled && isGamePage}
		<div class="home-button-container">
			<button class="home-btn" on:click={goHome}>
				<span class="home-icon">🏠</span>
				<span class="home-text">Home</span>
			</button>
		</div>
	{/if}
	
	<main class:full-width={isLandingPage}>
		<slot />
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.home-button-container {
		position: fixed;
		top: 80px;
		right: 16px;
		z-index: 50;
	}

	.home-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: linear-gradient(180deg, #F5C542, #d4a520);
		color: #1a1a1a;
		border: none;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 4px 15px rgba(245, 197, 66, 0.4);
		transition: all 0.2s ease;
	}

	.home-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(245, 197, 66, 0.5);
	}

	.home-icon {
		font-size: 1rem;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	main.full-width {
		max-width: none;
		padding: 0;
	}
</style>
