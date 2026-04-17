import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, frontendRoot, '');

    return {
        plugins: [react(), tailwindcss()],
        publicDir: false,
        resolve: {
            alias: {
                '@': path.resolve(frontendRoot, 'src'),
            },
        },
        build: {
            outDir: path.resolve(frontendRoot, 'dist'),
            emptyOutDir: true,
            chunkSizeWarningLimit: 1000,
        },
        server: {
            host: '0.0.0.0',
            port: 5173,
            strictPort: true,
            proxy: {
                '/api.php': {
                    target: env.VITE_BACKEND_URL,
                    changeOrigin: true,
                },
            },
        },
    };
});
