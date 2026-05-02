import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// resolves paths relative to the frontend project root.
const frontendRoot = fileURLToPath(new URL('.', import.meta.url));

// configures vite for react, tailwind, aliases, build output, and api proxying.
export default defineConfig(({ mode }) => {
    // loads mode-specific env values so the dev proxy can find the backend.
    const env = loadEnv(mode, frontendRoot, '');

    return {
        // react handles jsx while tailwind compiles utility css.
        plugins: [react(), tailwindcss()],
        publicDir: false,
        resolve: {
            // @ points at src for concise imports throughout the frontend.
            alias: {
                '@': path.resolve(frontendRoot, 'src'),
            },
        },
        build: {
            // writes production assets inside frontend/dist.
            outDir: path.resolve(frontendRoot, 'dist'),
            emptyOutDir: true,
            chunkSizeWarningLimit: 1000,
        },
        server: {
            // binds the dev server for local and container access.
            host: '0.0.0.0',
            port: 5173,
            strictPort: true,
            proxy: {
                // forwards php api calls to the configured backend server.
                '/api.php': {
                    target: env.VITE_BACKEND_URL,
                    changeOrigin: true,
                },
            },
        },
    };
});
