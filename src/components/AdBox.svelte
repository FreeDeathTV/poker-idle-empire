<script lang="ts">
  export let position: 'left' | 'right' = 'left';
  
  // Initialize AdSense when component mounts
  import { onMount } from 'svelte';
  
  onMount(() => {
    // Initialize AdSense for this ad slot
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('AdSense initialization failed:', e);
      }
    }
  });
</script>

<div class="ad-box-container">
  <div class="ad-box adsense-active">
    <div class="ad-content">
      <!-- Google AdSense Side Box Ad -->
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-4126734833336979"
           data-ad-slot="9455812753"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  </div>
</div>

<style>
  .ad-box-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 1rem;
  }

  .ad-box {
    width: 100%;
    max-width: 400px;
    min-height: 300px;
    background: linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%);
    border-radius: 16px;
    border: 2px solid rgba(245, 197, 66, 0.3);
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.5),
      0 0 40px rgba(245, 197, 66, 0.2);
    padding: 2rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .ad-box:hover {
    transform: translateY(-5px);
    border-color: rgba(245, 197, 66, 0.8);
    box-shadow: 
      0 15px 40px rgba(0, 0, 0, 0.6),
      0 0 60px rgba(245, 197, 66, 0.4);
  }

  .ad-content {
    position: relative;
    z-index: 2;
  }

  .ad-label {
    font-size: 0.7rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 1rem;
    font-weight: 700;
  }

  .ad-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .ad-icon {
    font-size: 3rem;
    opacity: 0.6;
  }

  .ad-text {
    font-size: 1.2rem;
    font-weight: 800;
    color: #F5C542;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .ad-tagline {
    font-size: 0.9rem;
    color: #ccc;
    font-style: italic;
  }

  /* Decorative elements */
  .ad-box::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 0%, rgba(245, 197, 66, 0.1) 0%, transparent 50%);
    z-index: 1;
  }

  .ad-box::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, #F5C542, transparent);
    z-index: 1;
  }

  /* Google AdSense integration */
  .ad-box.adsense-active {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
  }

  .ad-box.adsense-active .ad-content {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid rgba(245, 197, 66, 0.3);
  }

  @media (max-width: 768px) {
    .ad-box-container {
      padding: 0.5rem;
    }
    
    .ad-box {
      max-width: 100%;
      padding: 1.5rem;
    }
  }
</style>