// normalizes the configured backend base url by removing a trailing slash.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.trim().replace(/\/$/, '');

// builds the api endpoint url for a specific backend action.
export function apiUrl(action: string): string {
    const url = new URL('/api.php', apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`);
    url.searchParams.set('action', action);
    return url.toString();
}

// fetches json and turns non-ok responses into thrown errors.
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const payload = (await response.json()) as T & { error?: string };

    // callers handle failures through try/catch in the store layer.
    if (!response.ok) {
        throw new Error('Request failed.');
    }

    return payload;
}
