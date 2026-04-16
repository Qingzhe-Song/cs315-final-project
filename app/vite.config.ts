import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    publicDir: false,
    build: {
        manifest: true,
        outDir: resolve(__dirname, 'public/assets'),
        emptyOutDir: true,
        assetsDir: '',
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            input: 'frontend/app.tsx',
            output: {
                entryFileNames: 'app.js',
                chunkFileNames: 'chunks/[name]-[hash].js',
                assetFileNames: '[name]-[hash][extname]',
            },
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
    },
});
