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
                description: "Poker Idle Empire - A deterministic idle poker empire builder where you expand, upgrade, and automate your way through escalating rival waves. Build velvet-lined lounges, train AI pros, and conquer tournament circuits in a strategic loop that rewards mastery over mindless tapping.",
                start_url: "/",
                display: "standalone",
                orientation: "portrait-primary",
                background_color: "#000000",
                theme_color: "#000000",
                categories: ["entertainment", "games", "casino"],
                lang: "en",
                scope: "./",
                icons: [
                    {
                        src: "/icon-144.png",
                        sizes: "144x144",
                        type: "image/png"
                    },
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
                ],
                screenshots: [
                    {
                        src: "/screenshots/landing/bonusGames.png",
                        sizes: "1280x720",
                        type: "image/png",
                        label: "Bonus Games Interface"
                    },
                    {
                        src: "/screenshots/landing/dealButton.png",
                        sizes: "1280x720",
                        type: "image/png",
                        label: "Deal Button Gameplay"
                    },
                    {
                        src: "/screenshots/landing/WelcomeBack.png",
                        sizes: "1280x720",
                        type: "image/png",
                        label: "Welcome Back Screen"
                    }
                ]
            },
            registerType: 'autoUpdate'
        })
    ]
});
