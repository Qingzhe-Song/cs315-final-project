import { useStore } from '@nanostores/react';

import {
    $appTitle,
    $catalog,
    $chartCaption,
    $chartEmptyMessage,
    $formValues,
    $isRunning,
    $latestResult,
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
    toggleVisualization,
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

export function useResultsSectionStore() {
    const result = useStore($latestResult);
    const visibleRows = useStore($visibleRows);
    const visibleRowTotal = useStore($visibleRowTotal);
    const showVisualization = useStore($showVisualization);
    const tableSummary = useStore($tableSummary);
    const tableFallbackMessage = useStore($tableFallbackMessage);
    const chartCaption = useStore($chartCaption);
    const chartEmptyMessage = useStore($chartEmptyMessage);

    return {
        result,
        visibleRows,
        visibleRowTotal,
        showVisualization,
        tableSummary,
        tableFallbackMessage,
        chartCaption,
        chartEmptyMessage,
        toggleVisualization,
    };
}
