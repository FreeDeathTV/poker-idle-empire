<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    getDigitSlots, 
    getAnimationDuration, 
    shouldUseStepUpdates, 
    getStepUpdateInterval, 
    getEasingFunction,
    type DigitSlot,
    type OdometerConfig,
    DEFAULT_CONFIG 
  } from '$lib/odometerUtils';
  import { formatNumber } from '$lib/stores';

  // Props
  export let chips: number = 0;
  export let cps: number = 0;
  export let isResetFlow: boolean = false;
  export let config: OdometerConfig = DEFAULT_CONFIG;

  // Internal state
  let currentSlots: DigitSlot[] = [];
  let targetSlots: DigitSlot[] = [];
  let animationFrameId: number | null = null;
  let animationStartTime: number = 0;
  let animationDuration: number = 0;
  let isAnimating: boolean = false;
  let lastChipsValue: number = 0;
  let stepUpdateTimer: ReturnType<typeof setInterval> | null = null;
  let currentStepValue: number = 0;
  let targetStepValue: number = 0;
  let stepStartTime: number = 0;
  let stepInterval: number = 0;
  let stepDuration: number = 0;

  // Initialize slots
  $: if (chips !== lastChipsValue) {
    lastChipsValue = chips;
    targetSlots = getDigitSlots(chips);
    
    // Check if we should use step updates for high CPS
    if (shouldUseStepUpdates(cps, config)) {
      startStepUpdate();
    } else {
      startAnimation();
    }
  }

  // Update animation duration when CPS or reset flow state changes
  $: if (isAnimating) {
    animationDuration = getAnimationDuration(cps, isResetFlow, config);
  }

  function startStepUpdate() {
    if (stepUpdateTimer) {
      clearInterval(stepUpdateTimer);
    }
    
    currentStepValue = chips;
    targetStepValue = chips;
    stepInterval = getStepUpdateInterval(cps, config);
    stepDuration = 2000; // 2 seconds for step animation
    
    stepUpdateTimer = setInterval(() => {
      const now = Date.now();
      if (!stepStartTime) {
        stepStartTime = now;
      }
      
      const elapsed = now - stepStartTime;
      if (elapsed >= stepDuration) {
        currentStepValue = targetStepValue;
        stepStartTime = 0;
      } else {
        currentStepValue = Math.floor(
          currentStepValue + (targetStepValue - currentStepValue) * (elapsed / stepDuration)
        );
      }
    }, stepInterval);
  }

  function startAnimation() {
    if (isAnimating) {
      cancelAnimationFrame(animationFrameId!);
    }
    
    currentSlots = targetSlots;
    targetSlots = getDigitSlots(chips);
    animationDuration = getAnimationDuration(cps, isResetFlow, config);
    animationStartTime = Date.now();
    isAnimating = true;
    
    const animate = (timestamp: number) => {
      if (!isAnimating) return;
      
      const elapsed = timestamp - animationStartTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easingFn = getEasingFunction(isResetFlow);
      const easedProgress = easingFn(progress);
      
      // Update slots based on progress
      currentSlots = targetSlots.map((target, index) => {
        if (target.isDecimal || target.isSuffix) {
          return target;
        }
        
        // For individual digit animation, we'd need more complex logic
        // For now, we'll update the entire display when animation completes
        return target;
      });
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Animation complete
        currentSlots = targetSlots;
        isAnimating = false;
        animationFrameId = null;
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
  }

  function getSlotDisplay(slot: DigitSlot): string {
    if (slot.isDecimal) return '.';
    if (slot.isSuffix) {
      // Find the suffix character
      const formatted = formatNumber(chips);
      const suffixMatch = formatted.match(/[KMBT]$/);
      return suffixMatch ? suffixMatch[0] : '';
    }
    return slot.value.toString();
  }

  function getSlotClass(slot: DigitSlot): string {
    const base = 'digit-slot';
    if (slot.isDecimal) return `${base} decimal`;
    if (slot.isSuffix) return `${base} suffix font-bold text-yellow-400`;
    return base;
  }

  onMount(() => {
    currentSlots = getDigitSlots(chips);
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (stepUpdateTimer) {
      clearInterval(stepUpdateTimer);
    }
  });
</script>

<div class="chip-odometer flex items-center gap-0.5">
  {#each currentSlots as slot, index (index)}
    <div class={getSlotClass(slot)}>
      {getSlotDisplay(slot)}
    </div>
  {/each}
</div>

<style>
  .chip-odometer {
    font-variant-numeric: tabular-nums;
    font-family: 'Fira Mono', monospace;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  
  .digit-slot {
    min-width: 1.2rem;
    text-align: center;
    position: relative;
    color: #1b1303;
    background: linear-gradient(180deg, #ffffff, #ffeaa0);
    border: 1px solid #c9a300;
    border-radius: 4px;
    padding: 2px 6px;
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -2px 3px rgba(0,0,0,0.15);
    transition: transform 0.1s ease-out;
  }
  
  .digit-slot.decimal {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
    min-width: 0.8rem;
  }
  
  .digit-slot.suffix {
    background: linear-gradient(180deg, #ffd766, #e3a81b);
    border-color: #74521b;
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -2px 3px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.2);
    min-width: 1.4rem;
    font-size: 0.9em;
  }
  
  /* Animation classes for future enhancement */
  .digit-slot.enter {
    animation: slideIn 0.3s ease-out;
  }
  
  .digit-slot.exit {
    animation: slideOut 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(-100%); opacity: 0; }
  }
</style>