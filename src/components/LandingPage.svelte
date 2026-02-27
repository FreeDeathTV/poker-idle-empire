<script lang="ts">
  import HeroSection from './HeroSection.svelte';
  import FeatureCards from './FeatureCards.svelte';
  import AceTokenHub from './AceTokenHub.svelte';
  import InstallSection from './InstallSection.svelte';
  import EnterGameCTA from './EnterGameCTA.svelte';
  import Footer from './Footer.svelte';
</script>

<div class="landing-page">
  <!-- Google AdSense Banner Ad -->
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
  <AceTokenHub />
  <InstallSection />
  <EnterGameCTA />
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
    position: sticky;
    top: 0;
    z-index: 50;
  }
  
  .adsense-banner-container ins.adsbygoogle {
    max-width: 100%;
    width: 100%;
    min-height: 60px;
  }
</style>
