import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import Info from 'unplugin-info/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        sourcemap: true
    },
    server: {
        host: '0.0.0.0'
    },
    resolve: {
        alias: {
            client: path.resolve(__dirname, 'client')
        }
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['offline.html', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
            srcDir: 'src',
            filename: 'sw.js',
            manifest: {
                theme_color: '#0476d9',
                background_color: '#0476d9',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                name: 'Concrnt',
                short_name: 'Concrnt',
                description:
                    'Concrnt is a next-gen decentralized social network platform designed to make your world richer.',
                icons: [
                    {
                        src: '192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: '512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: 'splash.png',
                        sizes: '300x300',
                        type: 'image/png',
                        purpose: 'any'
                    }
                ],
                screenshots: [
                    {
                        src: 'screenshot_narrow.jpg',
                        type: 'image/jpeg',
                        sizes: '1170x2532',
                        form_factor: 'narrow'
                    },
                    {
                        src: 'screenshot_wide.png',
                        type: 'image/png',
                        sizes: '1419x1260',
                        form_factor: 'wide'
                    }
                ],
                share_target: {
                    action: '/intent',
                    method: 'GET',
                    enctype: 'application/x-www-form-urlencoded',
                    params: {
                        title: 'title',
                        text: 'text',
                        url: 'url'
                    }
                }
            },
            strategies: 'injectManifest',
            injectManifest: {
                maximumFileSizeToCacheInBytes: 10 * 1024 ** 2,
                globPatterns: ['**/*.{css,html}', '**/index*.js']
            }
        }),
        Info(),
        visualizer()
    ]
})
