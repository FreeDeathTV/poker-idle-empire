import { redirect } from '@sveltejs/kit';

export const load = () => {
  // Always redirect to landing page for public entry
  throw redirect(302, '/landing');
};
