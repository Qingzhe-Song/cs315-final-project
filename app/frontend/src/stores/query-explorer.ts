import { atom, computed } from 'nanostores';

import { apiUrl, fetchJson } from '@/lib/api';
import { queryCatalog } from '@/lib/query-catalog';
import { defaultFormValues } from '@/lib/query-results';
import type { QueryDefinition, QueryExecutionResponse, QueryMode, QueryResult } from '@/types';

const DEFAULT_APP_TITLE = 'Steam Discovery Dashboard';
const READY_STATUS_TEXT = 'Parameters ready.';
const CUSTOM_READY_STATUS_TEXT = 'Filters ready.';
const REQUEST_FAILED_STATUS_TEXT = 'Request failed.';
const NO_QUERY_STATUS_TEXT = 'No query available.';
const CUSTOM_QUERY_DEFINITION: QueryDefinition = {
    id: 'custom',
    number: 0,
    title: 'Custom Filtered Games',
    summary: 'Build a simple game search by filtering title, genre, release year, price, and review count.',
    inputs: [],
    chart: { labelColumns: ['Title'], valueColumns: ['ReviewCount', 'RecommendationPct'], type: 'bar' },
};
const DEFAULT_CUSTOM_FORM_VALUES = {
    title_keyword: '',
    genre_keyword: '',
    min_release_year: '2018',
    max_price: '',
    min_reviews: '10',
    sort_by: 'reviews',
    limit: '25',
};

export const $appTitle = atom(DEFAULT_APP_TITLE);
export const $queryMode = atom<QueryMode>('preset');
export const $catalog = atom<QueryDefinition[]>(queryCatalog);
export const $selectedQueryId = atom('');
export const $formValues = atom<Record<string, string>>({});
export const $customFormValues = atom<Record<string, string>>(DEFAULT_CUSTOM_FORM_VALUES);
export const $latestResult = atom<QueryResult | null>(null);
export const $statusText = atom(READY_STATUS_TEXT);
export const $isRunning = atom(false);
export const $showVisualization = atom(false);

export const $selectedQuery = computed([$catalog, $selectedQueryId], (catalog, selectedQueryId) => {
    return catalog.find((query) => query.id === selectedQueryId) ?? null;
});

export const $activeQuery = computed([$queryMode, $selectedQuery], (queryMode, selectedQuery) => {
    if (queryMode === 'custom') {
        return CUSTOM_QUERY_DEFINITION;
    }

    return selectedQuery;
});

export const $visibleRows = computed($latestResult, (latestResult) => latestResult?.rows ?? []);
export const $visibleRowTotal = computed($visibleRows, (visibleRows) => visibleRows.length);

export const $queryTitle = computed($selectedQuery, (selectedQuery) => {
    if (selectedQuery) {
        return `${selectedQuery.number}. ${selectedQuery.title}`;
    }

    return NO_QUERY_STATUS_TEXT;
});

export const $querySummary = computed($selectedQuery, (selectedQuery) => {
    if (selectedQuery) {
        return selectedQuery.summary;
    }

    return NO_QUERY_STATUS_TEXT;
});

export const $tableSummary = computed(
    [$latestResult, $visibleRowTotal, $activeQuery],
    (latestResult, visibleRowTotal, activeQuery) => {
        if (latestResult) {
            return `${visibleRowTotal} of ${latestResult.rowCount} row(s) shown in ${latestResult.durationMs} ms.`;
        }

        if (activeQuery) {
            return 'Run a query to populate the result grid.';
        }

        return NO_QUERY_STATUS_TEXT;
    }
);

export const $chartCaption = computed($latestResult, (latestResult) => {
    if (latestResult) {
        return 'Chart.js plots up to the first 12 rows returned from the database.';
    }

    return 'Run a query, review the table, then open the visualization if you need it.';
});

export const $chartEmptyMessage = computed(
    [$latestResult, $activeQuery],
    (latestResult, activeQuery) => {
        if (latestResult) {
            return 'This result set did not expose numeric fields that can be charted.';
        }

        if (activeQuery) {
            return 'Run a query to render a chart.';
        }

        return NO_QUERY_STATUS_TEXT;
    }
);

export const $tableFallbackMessage = computed($activeQuery, (activeQuery) => {
    if (activeQuery) {
        return 'Run a query to load results.';
    }

    return NO_QUERY_STATUS_TEXT;
});

let hasLoadedCatalog = false;

function applySelection(query: QueryDefinition | null, statusText: string): void {
    $selectedQueryId.set(query?.id ?? '');
    $formValues.set(query ? defaultFormValues(query) : {});
    $latestResult.set(null);
    $showVisualization.set(false);
    $statusText.set(statusText);
}

export function setQueryMode(queryMode: QueryMode): void {
    if ($queryMode.get() === queryMode) {
        return;
    }

    $queryMode.set(queryMode);
    $latestResult.set(null);
    $showVisualization.set(false);
    $statusText.set(queryMode === 'custom' ? CUSTOM_READY_STATUS_TEXT : READY_STATUS_TEXT);
}

export async function initializeApp(initialTitle: string): Promise<void> {
    $appTitle.set(initialTitle || DEFAULT_APP_TITLE);

    if (hasLoadedCatalog) {
        return;
    }

    const selectedQuery = queryCatalog[0] ?? null;
    $catalog.set(queryCatalog);
    applySelection(selectedQuery, selectedQuery ? READY_STATUS_TEXT : NO_QUERY_STATUS_TEXT);
    hasLoadedCatalog = true;
}

export function selectQuery(queryId: string): void {
    $queryMode.set('preset');
    const selectedQuery = $catalog.get().find((query) => query.id === queryId) ?? null;
    applySelection(selectedQuery, selectedQuery ? READY_STATUS_TEXT : NO_QUERY_STATUS_TEXT);
}

export function updateFormValue(name: string, value: string): void {
    $formValues.set({
        ...$formValues.get(),
        [name]: value,
    });
}

export function updateCustomFormValue(name: string, value: string): void {
    $customFormValues.set({
        ...$customFormValues.get(),
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
    $queryMode.set('preset');
    $showVisualization.set(false);
    $statusText.set('Running query...');

    try {
        const result = await fetchJson<QueryExecutionResponse>(apiUrl('run'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                queryId: selectedQuery.id,
                params: $formValues.get(),
            }),
        });

        $latestResult.set({
            ...result,
            query: selectedQuery,
        });
        $statusText.set('Query complete.');
    } catch {
        $latestResult.set(null);
        $showVisualization.set(false);
        $statusText.set(REQUEST_FAILED_STATUS_TEXT);
    } finally {
        $isRunning.set(false);
    }
}

export async function runCustomQuery(): Promise<void> {
    $isRunning.set(true);
    $queryMode.set('custom');
    $showVisualization.set(false);
    $statusText.set('Running filtered query...');

    try {
        const result = await fetchJson<QueryExecutionResponse>(apiUrl('custom'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                params: $customFormValues.get(),
            }),
        });

        $latestResult.set({
            ...result,
            query: CUSTOM_QUERY_DEFINITION,
        });
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
