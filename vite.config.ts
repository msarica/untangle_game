import { defineConfig } from 'vite'

export default defineConfig({
    base: '/untangle/',
    server: {
        host: true,
        port: 3000
    },
    build: {
        target: 'esnext'
    }
})
