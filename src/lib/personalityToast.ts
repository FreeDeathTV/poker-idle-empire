import { writable } from 'svelte/store';
import { PERSONALITY_TOAST_COOLDOWN_MS, PERSONALITY_TOAST_DURATION_MS } from './v701Config';

export interface PersonalityToast {
  id: number;
  text: string;
}

const pendingQueue: string[] = [];
let activeTimer: ReturnType<typeof setTimeout> | null = null;
let cooldownTimer: ReturnType<typeof setTimeout> | null = null;
let lastShownAt = 0;

export const personalityToasts = writable<PersonalityToast[]>([]);

function processQueue() {
  if (pendingQueue.length === 0) return;
  const now = Date.now();
  const elapsed = now - lastShownAt;
  const waitMs = Math.max(0, PERSONALITY_TOAST_COOLDOWN_MS - elapsed);

  if (waitMs > 0) {
    if (cooldownTimer) return;
    cooldownTimer = setTimeout(() => {
      cooldownTimer = null;
      processQueue();
    }, waitMs);
    return;
  }

  const nextText = pendingQueue.shift();
  if (!nextText) return;

  lastShownAt = Date.now();
  const toast: PersonalityToast = { id: Date.now() + Math.random(), text: nextText };
  personalityToasts.set([toast]);

  if (activeTimer) clearTimeout(activeTimer);
  activeTimer = setTimeout(() => {
    personalityToasts.set([]);
    activeTimer = null;
    processQueue();
  }, PERSONALITY_TOAST_DURATION_MS);
}

export function enqueuePersonalityToast(text: string): void {
  if (!text) return;
  pendingQueue.push(text);
  processQueue();
}

