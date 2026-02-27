<script lang="ts">
  import ScreenshotCard from './ScreenshotCard.svelte';
  
  // Screenshots - actual paths
  const dealScreenPlaceholder = '/screenshots/landing/dealButton.png';
  const buildingListPlaceholder = '/screenshots/landing/bonusGames.png';
  const welcomeBackPlaceholder = '/screenshots/landing/WelcomeBack.png';
</script>

<section class="feature-cards">
  <div class="container">
    <h2 class="section-title">Why Play Poker Idle Empire?</h2>
    
    <div class="cards-grid">
      <!-- Card 1 - Idle Empire Builder -->
      <ScreenshotCard 
        screenshot={dealScreenPlaceholder}
        alt="DEAL screen with Poker Tables and Pro Dealers"
        title="Idle Empire Builder"
        description="Earn chips automatically. Upgrade your tables. Grow your empire."
      >
        <div class="placeholder-screen">
          <span>🃏</span>
        </div>
      </ScreenshotCard>
      
      <!-- Card 2 - Casino Minigames -->
      <ScreenshotCard 
        screenshot={buildingListPlaceholder}
        alt="Building list with Texas Hold'em Bonus, Slots, Chase the Ace, Roulette, Blackjack"
        title="Casino Minigames"
        description="Unlock casino classics as you expand your empire."
      >
        <div class="placeholder-screen">
          <span>🎰</span>
        </div>
      </ScreenshotCard>
      
      <!-- Card 3 - Offline Earnings -->
      <ScreenshotCard 
        screenshot={welcomeBackPlaceholder}
        alt="Welcome Back screen showing offline earnings"
        title="Offline Earnings"
        description="Your empire works even while you're away."
      >
        <div class="placeholder-screen">
          <span>💰</span>
        </div>
      </ScreenshotCard>
    </div>
  </div>
</section>

<style>
  .feature-cards {
    padding: 4rem 1rem;
    background: linear-gradient(180deg, #000000 0%, #1a1a2e 100%);
  }

  .container {
    max-width: 900px;
    margin: 0 auto;
  }

  .section-title {
    font-size: 2rem;
    font-weight: 900;
    color: #F5C542;
    text-align: center;
    margin-bottom: 3rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 0 20px rgba(245, 197, 66, 0.4);
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }

  .placeholder-screen {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #0a2a1a, #083f1a);
    font-size: 3rem;
  }

  @media (max-width: 768px) {
    .section-title {
      font-size: 1.5rem;
    }
    
    .cards-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
