import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
    plugins: [
        sveltekit(),
        SvelteKitPWA({
            manifest: {
                name: "Poker Idle Empire",
                short_name: "PokerIdle",
                start_url: "/",
                display: "standalone",
                background_color: "#000000",
                theme_color: "#000000",
                icons: [
                    {
                        src: "/icon-192.png",
                        sizes: "192x192",
                        type: "image/png"
                    },
                    {
                        src: "/icon-512.png",
                        sizes: "512x512",
                        type: "image/png"
                    },
                    {
                        src: "/icon-maskable.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable"
                    }
                ]
            },
            registerType: 'autoUpdate'
        })
    ]
});
