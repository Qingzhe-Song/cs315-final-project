import { BarChart3, Table2 } from 'lucide-react';
import type { JSX } from 'react';

import { ResultsChart } from '@/components/results-chart';
import { ResultsTable } from '@/components/results-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueryResult, RowValue } from '@/types';

interface ResultsSectionProps {
    result: QueryResult | null;
    visibleRows: Record<string, RowValue>[];
    visibleRowTotal: number;
    showVisualization: boolean;
    tableSummary: string;
    tableFallbackMessage: string;
    chartCaption: string;
    chartEmptyMessage: string;
    onToggleVisualization: () => void;
}

function ResultsSection({
    result,
    visibleRows,
    visibleRowTotal,
    showVisualization,
    tableSummary,
    tableFallbackMessage,
    chartCaption,
    chartEmptyMessage,
    onToggleVisualization,
}: ResultsSectionProps): JSX.Element {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="gap-2">
                    <div className="flex items-center gap-2 text-primary">
                        <Table2 className="size-4" />
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
                                <Button type="button" onClick={onToggleVisualization}>
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
