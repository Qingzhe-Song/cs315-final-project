const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.trim().replace(/\/$/, '');

export function apiUrl(action: string): string {
    const url = new URL('/api.php', apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`);
    url.searchParams.set('action', action);
    return url.toString();
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const payload = (await response.json()) as T & { error?: string };

    if (!response.ok) {
        throw new Error('Request failed.');
    }

    return payload;
}
