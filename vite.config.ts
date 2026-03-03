import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
    plugins: [
        sveltekit(),
        SvelteKitPWA({
            manifest: {
                id: "Idle-Poker-Empire",
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
                dir: "ltr",
                launch_handler: {
                    client_mode: "navigate-existing"
                },
                shortcuts: [
                    {
                        name: "Play Game",
                        short_name: "Game",
                        description: "Start playing Poker Idle Empire",
                        url: "/app",
                        icons: [{ src: "/icon-192.png", sizes: "192x192" }]
                    },
                    {
                        name: "Shop",
                        short_name: "Shop",
                        description: "Visit the in-game shop",
                        url: "/shop",
                        icons: [{ src: "/icon-192.png", sizes: "192x192" }]
                    }
                ],
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
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/'),
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'app-shell',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                            },
                        },
                    },
                    {
                        urlPattern: /\.(png|jpg|jpeg|svg|gif)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                            },
                        },
                    },
                    {
                        urlPattern: /pwabuilder-sw\.js$/,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pwabuilder-sw',
                            expiration: {
                                maxEntries: 1,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                            },
                        },
                    },
                ],
                // Ensure pwabuilder-sw.js is included in the precache
                additionalManifestEntries: [
                    {
                        url: 'pwabuilder-sw.js',
                        revision: '1'
                    }
                ],
                // Configure to serve service worker files correctly
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/pwabuilder-sw\.js$/],
            },
            devOptions: {
                enabled: true,
                type: 'module',
            }
        })
    ]
});
