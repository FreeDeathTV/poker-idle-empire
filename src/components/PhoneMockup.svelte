<script lang="ts">
  export let screenshot: string = '';
  export let alt: string = 'App screenshot';
</script>

<div class="phone-mockup">
  <div class="phone-frame">
    <div class="phone-notch"></div>
    <div class="phone-screen">
      {#if screenshot}
        <img src={screenshot} {alt} class="screenshot-img" />
      {:else}
        <div class="screenshot-placeholder">
          <slot />
        </div>
      {/if}
    </div>
    <div class="phone-home-indicator"></div>
  </div>
</div>

<style>
  .phone-mockup {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .phone-frame {
    position: relative;
    width: 200px;
    height: 400px;
    background: #1a1a1a;
    border-radius: 28px;
    padding: 8px;
    box-shadow: 
      0 0 0 2px #333,
      0 8px 32px rgba(0, 0, 0, 0.5),
      0 0 60px rgba(74, 201, 255, 0.15);
  }

  .phone-notch {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 24px;
    background: #1a1a1a;
    border-radius: 12px;
    z-index: 10;
  }

  .phone-screen {
    width: 100%;
    height: 100%;
    border-radius: 20px;
    overflow: hidden;
    background: #0a0a0a;
  }

  .screenshot-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .screenshot-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-size: 0.75rem;
  }

  .phone-home-indicator {
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: #444;
    border-radius: 2px;
  }
</style>
