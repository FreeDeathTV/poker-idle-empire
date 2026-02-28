<script lang="ts">
  import GameOverview from './GameOverview.svelte';
  import HeroSection from './HeroSection.svelte';
  import FeatureCards from './FeatureCards.svelte';
  import AceTokenHub from './AceTokenHub.svelte';
  import InstallSection from './InstallSection.svelte';
  import EnterGameCTA from './EnterGameCTA.svelte';
  import Footer from './Footer.svelte';
  import AdBox from './AdBox.svelte';
</script>

<div class="landing-page">
  <!-- Game Title Section -->
  <div class="game-title-section">
    <h1 class="game-title">Poker Idle Empire</h1>
    <div class="game-subtitle">The Ultimate Poker Clicker Experience</div>
  </div>
  
  <!-- Floating CTA Button -->
  <EnterGameCTA />
  
  <!-- Rich Content for AdSense Compliance -->
  <GameOverview />
  
  <!-- Google AdSense Banner Ad - Placed after substantial content -->
  <div class="adsense-banner-container">
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-4126734833336979"
         data-ad-slot="1207386135"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  </div>
  
  <HeroSection />
  <FeatureCards />
  
  <!-- Ace Token Hub with Advertising Boxes -->
  <section class="ace-hub-section">
    <div class="hub-layout">
      <AdBox position="left" />
      <div class="hub-center">
        <AceTokenHub />
      </div>
      <AdBox position="right" />
    </div>
  </section>
  
  <InstallSection />
  <Footer />
</div>

<svelte:head>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4126734833336979"
       crossorigin="anonymous"></script>
</svelte:head>

<style>
  .landing-page {
    min-height: 100vh;
    background: #000000;
  }
  
  .game-title-section {
    text-align: center;
    padding: 3rem 1rem;
    background: linear-gradient(180deg, #000000 0%, #1a0f2a 100%);
    border-bottom: 2px solid rgba(255,215,0,0.3);
    position: relative;
    overflow: hidden;
  }
  
  .game-title {
    font-size: 4rem;
    font-weight: 900;
    background: linear-gradient(135deg, #FFD700, #FFA500, #FF4500);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-transform: uppercase;
    letter-spacing: 4px;
    margin: 0 0 1rem 0;
    text-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
    font-family: 'Georgia', serif;
  }
  
  .game-subtitle {
    font-size: 1.2rem;
    color: #ccc;
    font-weight: 300;
    letter-spacing: 2px;
    text-transform: uppercase;
    opacity: 0.8;
  }
  
  /* Decorative elements for title section */
  .game-title-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 0%, rgba(255,215,0,0.1) 0%, transparent 50%);
    pointer-events: none;
  }
  
  .game-title-section::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, #FFD700, transparent);
    pointer-events: none;
  }
  
  .adsense-banner-container {
    width: 100%;
    padding: 12px 20px;
    background: linear-gradient(180deg, rgba(255,215,0,0.15), rgba(0,0,0,0));
    border-bottom: 2px solid rgba(255,215,0,0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(6px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    position: relative;
    z-index: 10;
  }
  
  .adsense-banner-container ins.adsbygoogle {
    max-width: 100%;
    width: 100%;
    min-height: 60px;
  }
  
  .ace-hub-section {
    padding: 4rem 1rem;
    background: linear-gradient(180deg, #000000 0%, #1a0f2a 100%);
  }
  
  .hub-layout {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 2rem;
  }
  
  .hub-center {
    flex: 1;
    display: flex;
    justify-content: center;
  }
  
  /* Responsive design for mobile */
  @media (max-width: 768px) {
    .game-title {
      font-size: 2.5rem;
      letter-spacing: 2px;
      margin-bottom: 0.5rem;
    }
    
    .game-subtitle {
      font-size: 1rem;
      letter-spacing: 1px;
    }
    
    .game-title-section {
      padding: 2rem 1rem;
    }
    
    .hub-layout {
      display: flex;
      gap: 2rem;
      justify-content: center;
      align-items: flex-start;
      margin: 2rem 0;
      flex-wrap: wrap;
    }

    .hub-layout > * {
      flex: 1;
      min-width: 300px;
      max-width: 400px;
    }
  }
</style>
