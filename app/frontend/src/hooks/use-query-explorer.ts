import { useStore } from '@nanostores/react';

import {
    $appTitle,
    $catalog,
    $chartCaption,
    $chartRowLimit,
    $chartEmptyMessage,
    $customFormValues,
    $formValues,
    $isRunning,
    $latestResult,
    $queryMode,
    $querySummary,
    $queryTitle,
    $selectedQuery,
    $selectedQueryId,
    $showVisualization,
    $statusText,
    $tableFallbackMessage,
    $tableSummary,
    $visibleRowTotal,
    $visibleRows,
    selectQuery,
    setQueryMode,
    toggleVisualization,
    updateChartRowLimit,
    updateCustomFormValue,
    updateFormValue,
} from '@/stores/query-explorer';

// exposes the app title atom to components.
export function useAppTitleStore(): string {
    return useStore($appTitle);
}

// bundles catalog state with the action that changes the selected query.
export function useQueryCatalogStore() {
    const catalog = useStore($catalog);
    const selectedQueryId = useStore($selectedQueryId);

    return {
        catalog,
        selectedQueryId,
        selectQuery,
    };
}

// bundles the active query mode with the mode setter.
export function useQueryModeStore() {
    const queryMode = useStore($queryMode);

    return {
        queryMode,
        setQueryMode,
    };
}

// gathers all preset form state needed by the preset form card.
export function useQueryFormStore() {
    const queryTitle = useStore($queryTitle);
    const querySummary = useStore($querySummary);
    const selectedQuery = useStore($selectedQuery);
    const formValues = useStore($formValues);
    const statusText = useStore($statusText);
    const isRunning = useStore($isRunning);

    return {
        queryTitle,
        querySummary,
        selectedQuery,
        formValues,
        statusText,
        isRunning,
        updateFormValue,
    };
}

// gathers all custom form state needed by the custom form card.
export function useCustomQueryFormStore() {
    const customFormValues = useStore($customFormValues);
    const statusText = useStore($statusText);
    const isRunning = useStore($isRunning);

    return {
        customFormValues,
        statusText,
        isRunning,
        updateCustomFormValue,
    };
}

// keeps the loading overlay subscribed only to the running flag.
export function useQueryLoadingOverlayStore() {
    const isRunning = useStore($isRunning);

    return {
        isRunning,
    };
}

// gathers table and visualization state for the result section.
export function useResultsSectionStore() {
    const result = useStore($latestResult);
    const visibleRows = useStore($visibleRows);
    const visibleRowTotal = useStore($visibleRowTotal);
    const showVisualization = useStore($showVisualization);
    const chartRowLimit = useStore($chartRowLimit);
    const tableSummary = useStore($tableSummary);
    const tableFallbackMessage = useStore($tableFallbackMessage);
    const chartCaption = useStore($chartCaption);
    const chartEmptyMessage = useStore($chartEmptyMessage);

    return {
        result,
        visibleRows,
        visibleRowTotal,
        showVisualization,
        chartRowLimit,
        tableSummary,
        tableFallbackMessage,
        chartCaption,
        chartEmptyMessage,
        toggleVisualization,
        updateChartRowLimit,
    };
}
