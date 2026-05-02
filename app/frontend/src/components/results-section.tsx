import { BarChart3 } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { JSX } from 'react';

import { ResultsChart } from '@/components/results-chart';
import { ResultsTable } from '@/components/results-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useResultsSectionStore } from '@/hooks/use-query-explorer';

// renders the result table and optional visualization panel.
function ResultsSection(): JSX.Element {
    // gathers derived table and chart state from the central store.
    const {
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
    } = useResultsSectionStore();

    // clamps chart row input through the store helper.
    function handleChartRowLimitChange(event: ChangeEvent<HTMLInputElement>): void {
        updateChartRowLimit(event.currentTarget.value);
    }

    return (
        <div className="space-y-6">
            {/* table card is always visible so users know where results will land. */}
            <Card>
                <CardHeader className="gap-2">
                    <div className="flex items-center gap-2 text-primary">
                        <span className="text-xs font-medium uppercase tracking-wide">Table</span>
                    </div>
                    <CardTitle className="text-2xl">Result Table</CardTitle>
                    <CardDescription>{tableSummary}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResultsTable
                        columns={result?.columns ?? []}
                        rows={visibleRows}
                        hasResult={result !== null}
                        fallbackMessage={tableFallbackMessage}
                    />
                    {/* visualization controls only appear after a non-empty result. */}
                    {result && result.rowCount > 0 ? (
                        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {visibleRowTotal} of {result.rowCount} rows.
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button type="button" onClick={toggleVisualization}>
                                    <BarChart3 className="size-4" />
                                    {showVisualization ? 'Hide Visualization' : 'Show Visualization'}
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            {/* chart card mounts only when the user chooses to visualize the table. */}
            {showVisualization ? (
                <Card>
                    <CardHeader className="gap-2">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-primary">
                                    <span className="text-xs font-medium uppercase tracking-wide">Chart</span>
                                </div>
                                <CardTitle className="mt-2 text-2xl">Visualization</CardTitle>
                                <CardDescription className="mt-2">{chartCaption}</CardDescription>
                            </div>
                            {/* row limit lets users trim dense result sets before charting. */}
                            {result && result.rowCount > 0 ? (
                                <label className="w-full max-w-52 space-y-2">
                                    <span className="text-sm font-medium">Rows in Chart</span>
                                    <Input
                                        type="number"
                                        min="1"
                                        max={result.rowCount}
                                        value={chartRowLimit}
                                        onChange={handleChartRowLimitChange}
                                        className="h-10"
                                    />
                                </label>
                            ) : null}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResultsChart result={result} rowLimit={chartRowLimit} emptyMessage={chartEmptyMessage} />
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}

export { ResultsSection };
