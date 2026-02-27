import { writable } from 'svelte/store';

// Track if PWA is installed
export const pwaInstalled = writable(false);

// Check if running in standalone mode (PWA installed)
export function checkPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  return standalone || isIOSStandalone;
}

// Initialize PWA detection
export function initPwaDetection(): void {
  if (typeof window === 'undefined') return;

  // Check initial state
  pwaInstalled.set(checkPwaInstalled());

  // Listen for changes
  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    pwaInstalled.set(e.matches);
  });

  // Also check on iOS
  window.addEventListener('load', () => {
    pwaInstalled.set(checkPwaInstalled());
  });
}
