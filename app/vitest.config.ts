import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import Info from 'unplugin-info/vite'

export default defineConfig({
    plugins: [react(), Info()],
    resolve: {
        alias: {
            client: path.resolve(__dirname, 'client')
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/__tests__/setup.ts'],
        exclude: ['tests/**', 'node_modules/**']
    }
})
