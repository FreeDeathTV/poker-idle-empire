import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
plugins: [
sveltekit(),
VitePWA({
registerType: 'autoUpdate',
devOptions: { enabled: true },
includeAssets: ['favicon.png', 'icon-144.png', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'],
manifest: {
id: '/',
name: 'Poker Idle Empire',
short_name: 'IdlePoker',
description: 'Idle poker casino tycoon game for phone-first play',
theme_color: '#0a0a0a',
background_color: '#0a0a0a',
display_override: ['standalone'],
icons: [
{
src: '/icon-144.png',
sizes: '144x144',
type: 'image/png',
purpose: 'any'
},
{
src: '/icon-192.png',
sizes: '192x192',
type: 'image/png',
purpose: 'any'
},
{
src: '/icon-512.png',
sizes: '512x512',
type: 'image/png',
purpose: 'any'
},
{
src: '/icon-maskable.png',
sizes: '512x512',
type: 'image/png',
purpose: 'maskable'
}
]
}
})
]
});
