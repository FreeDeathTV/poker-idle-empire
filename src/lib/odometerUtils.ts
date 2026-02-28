// Odometer utility functions for deterministic horizontal chip display
// Pure functions - no game state modifications

export interface DigitSlot {
  value: number;
  isDecimal: boolean;
  isSuffix: boolean;
}

export interface OdometerConfig {
  lowCpsThreshold: number;
  midCpsThreshold: number;
  animationDuration: {
    low: number;
    mid: number;
    high: number;
    reset: number;
  };
}

// Default configuration
export const DEFAULT_CONFIG: OdometerConfig = {
  lowCpsThreshold: 100,
  midCpsThreshold: 1000,
  animationDuration: {
    low: 800,    // 800ms for low CPS
    mid: 400,    // 400ms for mid CPS
    high: 200,   // 200ms for high CPS
    reset: 100   // 100ms during Escape & Relocate
  }
};

/**
 * Convert chip value to digit slots for display
 * Returns array of digits with decimal point and suffix handling
 */
export function getDigitSlots(chips: number): DigitSlot[] {
  if (chips === 0) {
    return [{ value: 0, isDecimal: false, isSuffix: false }];
  }

  // Format number with K/M/B/T suffixes
  const formatted = formatNumberForOdometer(chips);
  
  const slots: DigitSlot[] = [];
  
  for (let i = 0; i < formatted.length; i++) {
    const char = formatted[i];
    
    if (char === '.') {
      slots.push({ value: -1, isDecimal: true, isSuffix: false }); // Special decimal marker
    } else if (['K', 'M', 'B', 'T'].includes(char)) {
      slots.push({ value: -2, isDecimal: false, isSuffix: true }); // Special suffix marker
    } else if (char >= '0' && char <= '9') {
      slots.push({ value: parseInt(char, 10), isDecimal: false, isSuffix: false });
    }
  }
  
  return slots;
}

/**
 * Format number for odometer display with K/M/B/T suffixes
 * Returns string like "2163717.1T"
 */
export function formatNumberForOdometer(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

/**
 * Get animation duration based on CPS and reset state
 */
export function getAnimationDuration(cps: number, isResetFlow: boolean, config: OdometerConfig = DEFAULT_CONFIG): number {
  if (isResetFlow) {
    return config.animationDuration.reset;
  }
  
  if (cps < config.lowCpsThreshold) {
    return config.animationDuration.low;
  } else if (cps < config.midCpsThreshold) {
    return config.animationDuration.mid;
  } else {
    return config.animationDuration.high;
  }
}

/**
 * Determine if we should use step updates for high CPS
 * Returns true if CPS is high enough to warrant step updates
 */
export function shouldUseStepUpdates(cps: number, config: OdometerConfig = DEFAULT_CONFIG): boolean {
  // Use step updates for very high CPS to prevent overwhelming animation
  return cps > config.midCpsThreshold * 10; // > 10,000 CPS
}

/**
 * Get step update interval for high CPS
 */
export function getStepUpdateInterval(cps: number, config: OdometerConfig = DEFAULT_CONFIG): number {
  if (cps > config.midCpsThreshold * 50) {
    return 1000; // 1 second for extremely high CPS
  } else if (cps > config.midCpsThreshold * 10) {
    return 500; // 500ms for very high CPS
  }
  return 250; // 250ms for moderately high CPS
}

/**
 * Easing function for smooth animations
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function for reset flow (snappier)
 */
export function easeOutQuad(t: number): number {
  return 1 - Math.pow(1 - t, 2);
}

/**
 * Get easing function based on context
 */
export function getEasingFunction(isResetFlow: boolean) {
  return isResetFlow ? easeOutQuad : easeOutCubic;
}

/**
 * Calculate next step value for high CPS step updates
 */
export function calculateStepValue(currentChips: number, targetChips: number, interval: number, totalDuration: number): number {
  const progress = Math.min(interval / totalDuration, 1);
  const eased = easeOutCubic(progress);
  return Math.floor(currentChips + (targetChips - currentChips) * eased);
}