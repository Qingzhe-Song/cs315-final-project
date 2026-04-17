import { atom, computed } from 'nanostores';

import { apiUrl, fetchJson } from '@/lib/api';
import { defaultFormValues } from '@/lib/query-results';
import type { CatalogResponse, QueryDefinition, QueryResult } from '@/types';

type CatalogState = 'loading' | 'ready' | 'error';

const DEFAULT_APP_TITLE = 'Steam Discovery Dashboard';
const LOADING_STATUS_TEXT = 'Loading query catalog...';
const READY_STATUS_TEXT = 'Parameters ready.';
const REQUEST_FAILED_STATUS_TEXT = 'Request failed.';
const NO_QUERY_STATUS_TEXT = 'No query available.';

export const $appTitle = atom(DEFAULT_APP_TITLE);
export const $catalog = atom<QueryDefinition[]>([]);
export const $selectedQueryId = atom('');
export const $formValues = atom<Record<string, string>>({});
export const $latestResult = atom<QueryResult | null>(null);
export const $statusText = atom(LOADING_STATUS_TEXT);
export const $isRunning = atom(false);
export const $showVisualization = atom(false);
export const $catalogState = atom<CatalogState>('loading');

export const $selectedQuery = computed([$catalog, $selectedQueryId], (catalog, selectedQueryId) => {
    return catalog.find((query) => query.id === selectedQueryId) ?? null;
});

export const $visibleRows = computed($latestResult, (latestResult) => latestResult?.rows ?? []);
export const $visibleRowTotal = computed($visibleRows, (visibleRows) => visibleRows.length);

export const $queryTitle = computed([$selectedQuery, $catalogState], (selectedQuery, catalogState) => {
    if (selectedQuery) {
        return `${selectedQuery.number}. ${selectedQuery.title}`;
    }

    if (catalogState === 'error') {
        return 'Catalog unavailable';
    }

    if (catalogState === 'ready') {
        return NO_QUERY_STATUS_TEXT;
    }

    return 'Loading...';
});

export const $querySummary = computed([$selectedQuery, $catalogState], (selectedQuery, catalogState) => {
    if (selectedQuery) {
        return selectedQuery.summary;
    }

    if (catalogState === 'error') {
        return 'The query catalog could not be loaded from the backend.';
    }

    if (catalogState === 'ready') {
        return NO_QUERY_STATUS_TEXT;
    }

    return LOADING_STATUS_TEXT;
});

export const $tableSummary = computed(
    [$latestResult, $visibleRowTotal, $selectedQuery, $catalogState],
    (latestResult, visibleRowTotal, selectedQuery, catalogState) => {
        if (latestResult) {
            return `${visibleRowTotal} of ${latestResult.rowCount} row(s) shown in ${latestResult.durationMs} ms.`;
        }

        if (selectedQuery) {
            return 'Run the selected analysis to populate the result grid.';
        }

        if (catalogState === 'error') {
            return 'The result grid is unavailable until the catalog loads.';
        }

        if (catalogState === 'ready') {
            return NO_QUERY_STATUS_TEXT;
        }

        return LOADING_STATUS_TEXT;
    }
);

export const $chartCaption = computed($latestResult, (latestResult) => {
    if (latestResult) {
        return 'Chart.js plots up to the first 12 rows returned from the database.';
    }

    return 'Run a query, review the table, then open the visualization if you need it.';
});

export const $chartEmptyMessage = computed(
    [$latestResult, $selectedQuery, $catalogState],
    (latestResult, selectedQuery, catalogState) => {
        if (latestResult) {
            return 'This result set did not expose numeric fields that can be charted.';
        }

        if (selectedQuery) {
            return 'Run the selected query to render a chart.';
        }

        if (catalogState === 'error') {
            return 'The query catalog could not be loaded.';
        }

        return LOADING_STATUS_TEXT;
    }
);

export const $tableFallbackMessage = computed([$selectedQuery, $catalogState], (selectedQuery, catalogState) => {
    if (selectedQuery) {
        return 'Run the selected query to load results.';
    }

    if (catalogState === 'error') {
        return 'The query catalog could not be loaded.';
    }

    return LOADING_STATUS_TEXT;
});

let catalogLoadPromise: Promise<void> | null = null;
let hasLoadedCatalog = false;

function applySelection(query: QueryDefinition | null, statusText: string): void {
    $selectedQueryId.set(query?.id ?? '');
    $formValues.set(query ? defaultFormValues(query) : {});
    $latestResult.set(null);
    $showVisualization.set(false);
    $statusText.set(statusText);
}

export async function initializeApp(initialTitle: string): Promise<void> {
    $appTitle.set(initialTitle || DEFAULT_APP_TITLE);

    if (hasLoadedCatalog) {
        return;
    }

    if (catalogLoadPromise) {
        return catalogLoadPromise;
    }

    $catalogState.set('loading');
    $statusText.set(LOADING_STATUS_TEXT);

    catalogLoadPromise = (async () => {
        try {
            const payload = await fetchJson<CatalogResponse>(apiUrl('catalog'));
            const catalog = payload.queries;
            const selectedQuery = catalog[0] ?? null;

            $appTitle.set(payload.appTitle || initialTitle || DEFAULT_APP_TITLE);
            $catalog.set(catalog);
            $catalogState.set('ready');
            applySelection(selectedQuery, selectedQuery ? READY_STATUS_TEXT : NO_QUERY_STATUS_TEXT);
            hasLoadedCatalog = true;
        } catch {
            $catalog.set([]);
            $catalogState.set('error');
            applySelection(null, REQUEST_FAILED_STATUS_TEXT);
        } finally {
            catalogLoadPromise = null;
        }
    })();

    return catalogLoadPromise;
}

export function selectQuery(queryId: string): void {
    const selectedQuery = $catalog.get().find((query) => query.id === queryId) ?? null;
    applySelection(selectedQuery, selectedQuery ? READY_STATUS_TEXT : NO_QUERY_STATUS_TEXT);
}

export function updateFormValue(name: string, value: string): void {
    $formValues.set({
        ...$formValues.get(),
        [name]: value,
    });
}

export async function runSelectedQuery(): Promise<void> {
    const selectedQuery = $selectedQuery.get();

    if (!selectedQuery) {
        $statusText.set(NO_QUERY_STATUS_TEXT);
        return;
    }

    $isRunning.set(true);
    $showVisualization.set(false);
    $statusText.set('Running query...');

    try {
        const result = await fetchJson<QueryResult>(apiUrl('run'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                queryId: selectedQuery.id,
                params: $formValues.get(),
            }),
        });

        $latestResult.set(result);
        $statusText.set('Query complete.');
    } catch {
        $latestResult.set(null);
        $showVisualization.set(false);
        $statusText.set(REQUEST_FAILED_STATUS_TEXT);
    } finally {
        $isRunning.set(false);
    }
}

export function toggleVisualization(): void {
    if (!$latestResult.get() || $latestResult.get()?.rowCount === 0) {
        return;
    }

    $showVisualization.set(!$showVisualization.get());
}
