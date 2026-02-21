<script lang="ts">
  import { onMount } from 'svelte';

  interface Particle {
    id: number;
    left: number;
    top: number;
    delay: number;
    duration: number;
    color: string;
    rotation: number;
    size: number;
  }

  let particles: Particle[] = [];

  const colors = ['#FFD700', '#FFA500', '#FF69B4', '#87CEEB', '#90EE90', '#FFB6C1', '#DDA0DD'];

  onMount(() => {
    // Generate 20-30 confetti particles
    const particleCount = Math.floor(Math.random() * 11) + 20; // 20-30 particles

    particles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // Random horizontal position (0-100%)
      top: Math.random() * 20 - 20, // Start above viewport (random -20% to 0%)
      delay: Math.random() * 0.2, // Stagger animations
      duration: 2 + Math.random() * 0.5, // 2-2.5s
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      size: Math.random() * 8 + 4 // 4-12px
    }));
  });
</script>

<!-- Confetti particles -->
{#each particles as particle (particle.id)}
  <div
    class="fixed pointer-events-none"
    style="
      left: {particle.left}%;
      top: {particle.top}%;
      animation: confetti-fall {particle.duration}s ease-in forwards;
      animation-delay: {particle.delay}s;
    "
  >
    <div
      style="
        width: {particle.size}px;
        height: {particle.size}px;
        background-color: {particle.color};
        border-radius: {Math.random() > 0.5 ? '50%' : '0'};
        animation: confetti-spin {particle.duration}s linear forwards;
        animation-delay: {particle.delay}s;
      "
    />
  </div>
{/each}

<style>
  @keyframes confetti-fall {
    0% {
      opacity: 1;
      transform: translateY(0) translateX(0);
    }
    100% {
      opacity: 0;
      transform: translateY(100vh) translateX(calc(var(--tx) * 50px));
    }
  }

  @keyframes confetti-spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  :global(.confetti-container) {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 60;
  }
</style>
