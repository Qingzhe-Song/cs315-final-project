import { BarChart3 } from 'lucide-react';
import type { JSX } from 'react';

import { ResultsChart } from '@/components/results-chart';
import { ResultsTable } from '@/components/results-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useResultsSectionStore } from '@/hooks/use-query-explorer';

function ResultsSection(): JSX.Element {
    const {
        result,
        visibleRows,
        visibleRowTotal,
        showVisualization,
        tableSummary,
        tableFallbackMessage,
        chartCaption,
        chartEmptyMessage,
        toggleVisualization,
    } = useResultsSectionStore();

    return (
        <div className="space-y-6">
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

            {showVisualization ? (
                <Card>
                    <CardHeader className="gap-2">
                        <div className="flex items-center gap-2 text-primary">
                            <BarChart3 className="size-4" />
                            <span className="text-xs font-medium uppercase tracking-wide">Chart</span>
                        </div>
                        <CardTitle className="text-2xl">Visualization</CardTitle>
                        <CardDescription>{chartCaption}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResultsChart result={result} emptyMessage={chartEmptyMessage} />
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}

export { ResultsSection };
