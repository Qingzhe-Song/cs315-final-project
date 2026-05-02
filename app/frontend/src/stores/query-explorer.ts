import { atom, computed } from 'nanostores';

import { apiUrl, fetchJson } from '@/lib/api';
import { queryCatalog } from '@/lib/query-catalog';
import { clampChartRowLimit, defaultFormValues } from '@/lib/query-results';
import type { QueryDefinition, QueryExecutionResponse, QueryMode, QueryResult, QueryStatus } from '@/types';

// default labels and fallback messages keep empty states consistent.
const DEFAULT_APP_TITLE = 'Steam Discovery Dashboard';
const NO_QUERY_STATUS_TEXT = 'No query available.';
// custom queries reuse the normal result pipeline with a synthetic definition.
const CUSTOM_QUERY_DEFINITION: QueryDefinition = {
    id: 'custom',
    number: 0,
    title: 'Custom Filtered Games',
    summary: 'Build a simple game search by filtering title, genre, release year, price, and review count.',
    inputs: [],
    chart: {
        type: 'bar',
        labelColumns: ['Title'],
        valueColumns: ['ReviewCount', 'RecommendationPct'],
        indexAxis: 'y',
    },
};
// custom form defaults mirror the backend's filter defaults.
const DEFAULT_CUSTOM_FORM_VALUES = {
    title_keyword: '',
    genre_keyword: '',
    min_release_year: '2018',
    max_price: '',
    min_reviews: '10',
    sort_by: 'reviews',
    limit: '25',
};

// source atoms hold the writable state for app title, query choice, forms, and results.
export const $appTitle = atom(DEFAULT_APP_TITLE);
export const $queryMode = atom<QueryMode>('preset');
export const $catalog = atom<QueryDefinition[]>(queryCatalog);
export const $selectedQueryId = atom('');
export const $formValues = atom<Record<string, string>>({});
export const $customFormValues = atom<Record<string, string>>(DEFAULT_CUSTOM_FORM_VALUES);
export const $latestResult = atom<QueryResult | null>(null);
export const $queryStatus = atom<QueryStatus>('ready');
export const $statusText = computed($queryStatus, (queryStatus) => `${queryStatus[0].toUpperCase()}${queryStatus.slice(1)}`);
export const $isRunning = atom(false);
export const $showVisualization = atom(false);
export const $chartRowLimit = atom(0);

// derives the full query object from the selected query id.
export const $selectedQuery = computed([$catalog, $selectedQueryId], (catalog, selectedQueryId) => {
    return catalog.find((query) => query.id === selectedQueryId) ?? null;
});

// resolves the active query definition for preset and custom modes.
export const $activeQuery = computed([$queryMode, $selectedQuery], (queryMode, selectedQuery) => {
    if (queryMode === 'custom') {
        return CUSTOM_QUERY_DEFINITION;
    }

    return selectedQuery;
});

// table rows are derived from the latest query result.
export const $visibleRows = computed($latestResult, (latestResult) => latestResult?.rows ?? []);
export const $visibleRowTotal = computed($visibleRows, (visibleRows) => visibleRows.length);

// preset query title includes the catalog number when a query is selected.
export const $queryTitle = computed($selectedQuery, (selectedQuery) => {
    if (selectedQuery) {
        return `${selectedQuery.number}. ${selectedQuery.title}`;
    }

    return NO_QUERY_STATUS_TEXT;
});

// preset query summary falls back to an empty-selection message.
export const $querySummary = computed($selectedQuery, (selectedQuery) => {
    if (selectedQuery) {
        return selectedQuery.summary;
    }

    return NO_QUERY_STATUS_TEXT;
});

// table copy changes based on whether results or a runnable query exist.
export const $tableSummary = computed(
    [$latestResult, $visibleRowTotal, $activeQuery],
    (latestResult, visibleRowTotal, activeQuery) => {
        if (latestResult) {
            return `${visibleRowTotal} of ${latestResult.rowCount} row(s) shown.`;
        }

        if (activeQuery) {
            return 'Run a query to populate the table.';
        }

        return NO_QUERY_STATUS_TEXT;
    }
);

// chart caption reports how many fetched rows are currently used for charting.
export const $chartCaption = computed([$latestResult, $chartRowLimit], (latestResult, chartRowLimit) => {
    if (latestResult) {
        const visibleChartRows = clampChartRowLimit(chartRowLimit, latestResult.rowCount);
        return `Rendering first ${visibleChartRows} of ${latestResult.rowCount} fetched rows.`;
    }

    return 'Run a query, review the table, then open the visualization if you need it.';
});

// chart empty text distinguishes no data from no runnable query.
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

// table fallback text is shown before any rows have been loaded.
export const $tableFallbackMessage = computed($activeQuery, (activeQuery) => {
    if (activeQuery) {
        return 'Run a query to load results.';
    }

    return NO_QUERY_STATUS_TEXT;
});

// prevents reinitializing the catalog during react strict mode remounts.
let hasLoadedCatalog = false;

// changes the selected query and resets dependent form/result state.
function applySelection(query: QueryDefinition | null, queryStatus: QueryStatus): void {
    $selectedQueryId.set(query?.id ?? '');
    $formValues.set(query ? defaultFormValues(query) : {});
    $latestResult.set(null);
    $showVisualization.set(false);
    $chartRowLimit.set(0);
    $queryStatus.set(queryStatus);
}

// marks a query as loading and hides stale visualizations.
function startQueryRun(): void {
    $isRunning.set(true);
    $showVisualization.set(false);
    $queryStatus.set('loading');
}

// clears the running flag after success or failure.
function finishQueryRun(): void {
    $isRunning.set(false);
}

// switches between preset and custom modes while clearing old results.
export function setQueryMode(queryMode: QueryMode): void {
    if ($queryMode.get() === queryMode) {
        return;
    }

    $queryMode.set(queryMode);
    $latestResult.set(null);
    $showVisualization.set(false);
    $chartRowLimit.set(0);
    $queryStatus.set('ready');
}

// seeds the app title and selects the first catalog query once.
export async function initializeApp(initialTitle: string): Promise<void> {
    $appTitle.set(initialTitle || DEFAULT_APP_TITLE);

    // avoids double initialization in development strict mode.
    if (hasLoadedCatalog) {
        return;
    }

    const selectedQuery = queryCatalog[0] ?? null;
    $catalog.set(queryCatalog);
    applySelection(selectedQuery, selectedQuery ? 'ready' : 'error');
    hasLoadedCatalog = true;
}

// selects a preset query and refreshes its default form values.
export function selectQuery(queryId: string): void {
    $queryMode.set('preset');
    const selectedQuery = $catalog.get().find((query) => query.id === queryId) ?? null;
    applySelection(selectedQuery, selectedQuery ? 'ready' : 'error');
}

// updates one preset form field while preserving the others.
export function updateFormValue(name: string, value: string): void {
    $formValues.set({
        ...$formValues.get(),
        [name]: value,
    });
}

// updates one custom form field while preserving the others.
export function updateCustomFormValue(name: string, value: string): void {
    $customFormValues.set({
        ...$customFormValues.get(),
        [name]: value,
    });
}

// runs the selected stored procedure through the api endpoint.
export async function runSelectedQuery(): Promise<void> {
    const selectedQuery = $selectedQuery.get();

    // protects the backend from requests without a valid selection.
    if (!selectedQuery) {
        $queryStatus.set('error');
        return;
    }

    startQueryRun();
    $queryMode.set('preset');

    try {
        // sends the query id plus current form params to the backend.
        const result = await fetchJson<QueryExecutionResponse>(apiUrl('run'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                queryId: selectedQuery.id,
                params: $formValues.get(),
            }),
        });

        // attaches catalog metadata so result rendering can use chart config.
        $latestResult.set({
            ...result,
            query: selectedQuery,
        });
        $chartRowLimit.set(result.rowCount);
        $queryStatus.set('complete');
    } catch {
        // failed runs clear stale result and chart state.
        $latestResult.set(null);
        $showVisualization.set(false);
        $chartRowLimit.set(0);
        $queryStatus.set('error');
    } finally {
        finishQueryRun();
    }
}

// runs the custom filtered query through the api endpoint.
export async function runCustomQuery(): Promise<void> {
    startQueryRun();
    $queryMode.set('custom');

    try {
        // sends all custom filter fields as backend params.
        const result = await fetchJson<QueryExecutionResponse>(apiUrl('custom'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                params: $customFormValues.get(),
            }),
        });

        // attaches the synthetic custom definition for chart rendering.
        $latestResult.set({
            ...result,
            query: CUSTOM_QUERY_DEFINITION,
        });
        $chartRowLimit.set(result.rowCount);
        $queryStatus.set('complete');
    } catch {
        // failed runs clear stale result and chart state.
        $latestResult.set(null);
        $showVisualization.set(false);
        $chartRowLimit.set(0);
        $queryStatus.set('error');
    } finally {
        finishQueryRun();
    }
}

// toggles the chart panel only when there is data to visualize.
export function toggleVisualization(): void {
    if (!$latestResult.get() || $latestResult.get()?.rowCount === 0) {
        return;
    }

    $showVisualization.set(!$showVisualization.get());
}

// updates the chart row limit while keeping it within the result size.
export function updateChartRowLimit(value: string): void {
    const latestResult = $latestResult.get();

    // ignores edits when no result exists yet.
    if (!latestResult) {
        return;
    }

    $chartRowLimit.set(clampChartRowLimit(Number(value), latestResult.rowCount));
}
