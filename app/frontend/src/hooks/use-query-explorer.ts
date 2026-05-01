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

export function useAppTitleStore(): string {
    return useStore($appTitle);
}

export function useQueryCatalogStore() {
    const catalog = useStore($catalog);
    const selectedQueryId = useStore($selectedQueryId);

    return {
        catalog,
        selectedQueryId,
        selectQuery,
    };
}

export function useQueryModeStore() {
    const queryMode = useStore($queryMode);

    return {
        queryMode,
        setQueryMode,
    };
}

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

export function useQueryLoadingOverlayStore() {
    const isRunning = useStore($isRunning);

    return {
        isRunning,
    };
}

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
