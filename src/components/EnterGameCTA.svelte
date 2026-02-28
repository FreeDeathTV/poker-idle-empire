<script lang="ts">
  import { goto } from '$app/navigation';
  
  function handleStartPlaying() {
    console.log('[EnterGameCTA] Button clicked, navigating to /app');
    goto('/app');
  }
</script>

<!-- Floating CTA Button -->
<div class="floating-cta">
  <div class="chip-animation">
    <span class="chip chip-1">🪙</span>
    <span class="chip chip-2">🎰</span>
    <span class="chip chip-3">🃏</span>
  </div>
  
  <button class="start-btn" on:click={handleStartPlaying}>
    Start Playing
  </button>
  
  <p class="subtext">No account needed</p>
</div>

<style>
  .floating-cta {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 100;
    background: rgba(42, 15, 58, 0.9);
    backdrop-filter: blur(10px);
    padding: 2rem;
    border-radius: 20px;
    border: 2px solid rgba(245, 197, 66, 0.3);
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.5),
      0 0 40px rgba(245, 197, 66, 0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
  }

  .floating-cta:hover {
    transform: translateY(-5px);
    border-color: rgba(245, 197, 66, 0.8);
    box-shadow: 
      0 15px 40px rgba(0, 0, 0, 0.6),
      0 0 60px rgba(245, 197, 66, 0.4);
  }

  .chip-animation {
    position: relative;
    height: 30px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .chip {
    position: absolute;
    font-size: 1.5rem;
    animation: chip-float 3s ease-in-out infinite;
  }

  .chip-1 {
    left: 20%;
    animation-delay: 0s;
  }

  .chip-2 {
    left: 50%;
    transform: translateX(-50%);
    animation-delay: 0.5s;
  }

  .chip-3 {
    right: 20%;
    animation-delay: 1s;
  }

  @keyframes chip-float {
    0%, 100% { 
      transform: translateX(-50%) translateY(0) rotate(0deg); 
      opacity: 0.6;
    }
    50% { 
      transform: translateX(-50%) translateY(-10px) rotate(15deg); 
      opacity: 1;
    }
  }

  .start-btn {
    display: inline-block;
    padding: 1rem 2.5rem;
    background: linear-gradient(180deg, #F5C542, #d4a520);
    color: #1a1a1a;
    font-size: 1.25rem;
    font-weight: 900;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 
      0 4px 20px rgba(245, 197, 66, 0.5),
      0 0 40px rgba(245, 197, 66, 0.2);
    transition: all 0.2s ease;
    min-width: 160px;
  }

  .start-btn:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 
      0 6px 25px rgba(245, 197, 66, 0.6),
      0 0 50px rgba(245, 197, 66, 0.3);
  }

  .start-btn:active {
    transform: translateY(0) scale(0.95);
  }

  .subtext {
    margin: 0;
    font-size: 0.8rem;
    color: #ccc;
    font-weight: 500;
    text-align: center;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .floating-cta {
      bottom: 20px;
      right: 20px;
      padding: 1.5rem;
      border-radius: 16px;
    }
    
    .start-btn {
      padding: 0.75rem 2rem;
      font-size: 1rem;
      min-width: 140px;
    }
    
    .chip {
      font-size: 1.2rem;
    }
  }

  /* Tablet responsiveness */
  @media (max-width: 1024px) and (min-width: 769px) {
    .floating-cta {
      bottom: 25px;
      right: 25px;
      padding: 1.75rem;
    }
  }
</style>
