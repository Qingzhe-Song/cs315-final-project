/// <reference types="vite/client" />

// vite exposes frontend environment variables through import.meta.env.
interface ImportMetaEnv {
    // base url used by the browser when calling the php api.
    readonly VITE_API_BASE_URL: string;
    // backend target used by vite's development proxy.
    readonly VITE_BACKEND_URL: string;
}

// narrows import.meta.env to the variables this app expects.
interface ImportMeta {
    readonly env: ImportMetaEnv;
}
