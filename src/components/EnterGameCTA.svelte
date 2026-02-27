<script lang="ts">
  import { goto } from '$app/navigation';
  
  function handleStartPlaying() {
    console.log('[EnterGameCTA] Button clicked, navigating to /app');
    goto('/app');
  }
</script>

<section class="enter-game-cta">
  <div class="cta-content">
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
</section>

<style>
  .enter-game-cta {
    padding: 4rem 1rem;
    background: linear-gradient(180deg, #2A0F3A 0%, #000000 100%);
  }

  .cta-content {
    text-align: center;
  }

  .chip-animation {
    position: relative;
    height: 40px;
    margin-bottom: 1.5rem;
  }

  .chip {
    position: absolute;
    font-size: 2rem;
    animation: chip-float 3s ease-in-out infinite;
  }

  .chip-1 {
    left: 30%;
    animation-delay: 0s;
  }

  .chip-2 {
    left: 50%;
    transform: translateX(-50%);
    animation-delay: 0.5s;
  }

  .chip-3 {
    right: 30%;
    animation-delay: 1s;
  }

  @keyframes chip-float {
    0%, 100% { 
      transform: translateY(0) rotate(0deg); 
      opacity: 0.6;
    }
    50% { 
      transform: translateY(-15px) rotate(15deg); 
      opacity: 1;
    }
  }

  .start-btn {
    display: inline-block;
    padding: 1.25rem 3rem;
    background: linear-gradient(180deg, #F5C542, #d4a520);
    color: #1a1a1a;
    font-size: 1.5rem;
    font-weight: 900;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 2px;
    box-shadow: 
      0 4px 20px rgba(245, 197, 66, 0.5),
      0 0 40px rgba(245, 197, 66, 0.2);
    transition: all 0.2s ease;
  }

  .start-btn:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 
      0 8px 30px rgba(245, 197, 66, 0.6),
      0 0 60px rgba(245, 197, 66, 0.3);
  }

  .start-btn:active {
    transform: translateY(0) scale(0.98);
  }

  .subtext {
    margin-top: 1rem;
    font-size: 0.95rem;
    color: #888;
    font-weight: 500;
  }
</style>
