<script lang="ts">
  import PhoneMockup from './PhoneMockup.svelte';
  
  export let screenshot: string = '';
  export let alt: string = 'Game screenshot';
  export let title: string = '';
  export let description: string = '';
</script>

<div class="screenshot-card">
  <PhoneMockup {screenshot} {alt}>
    <slot />
  </PhoneMockup>
  {#if title || description}
    <div class="card-content">
      {#if title}
        <h3 class="card-title">{title}</h3>
      {/if}
      {#if description}
        <p class="card-description">{description}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .screenshot-card {
    background: linear-gradient(145deg, #1a1a2e, #16162a);
    border-radius: 16px;
    padding: 16px;
    border: 2px solid #F5C542;
    box-shadow: 
      0 4px 20px rgba(0, 0, 0, 0.4),
      0 0 30px rgba(245, 197, 66, 0.1);
  }

  .card-content {
    margin-top: 12px;
    text-align: center;
  }

  .card-title {
    color: #F5C542;
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card-description {
    color: #e0e0e0;
    font-size: 0.85rem;
    line-height: 1.4;
    margin: 0;
  }
</style>
