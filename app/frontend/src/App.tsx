import Chart from 'chart.js/auto';
import { BarChart3, Gauge, Play, Table2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import type { CatalogResponse, QueryDefinition, QueryResult, RowValue } from './types';

interface ChartRows {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
    }>;
}

interface ResultsChartProps {
    result: QueryResult | null;
    emptyMessage: string;
}

interface ResultsTableProps {
    result: QueryResult | null;
    fallbackMessage: string;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');

function apiUrl(action: string): string {
    if (apiBaseUrl !== '') {
        const url = new URL('/api.php', apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`);
        url.searchParams.set('action', action);
        return url.toString();
    }

    return `/api.php?action=${encodeURIComponent(action)}`;
}

function defaultFormValues(query: QueryDefinition): Record<string, string> {
    return Object.fromEntries(query.inputs.map((input) => [input.name, String(input.default)]));
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const payload = (await response.json()) as T & { error?: string };

    if (!response.ok) {
        throw new Error(payload.error ?? 'Request failed.');
    }

    return payload;
}

function chartRows(result: QueryResult): ChartRows | null {
    if (!result.rows.length || !result.chart.valueColumns.length) {
        return null;
    }

    const rows = result.rows.slice(0, 12);
    const labels = rows.map((row) =>
        result.chart.labelColumns
            .map((column) => String(row[column] ?? ''))
            .filter(Boolean)
            .join(' • ')
    );

    const datasets = result.chart.valueColumns
        .map((column) => {
            let hasNumericValue = false;

            const data = rows.map((row) => {
                const value = Number(row[column]);
                if (Number.isFinite(value)) {
                    hasNumericValue = true;
                    return value;
                }

                return 0;
            });

            return {
                label: column,
                data,
                hasNumericValue,
            };
        })
        .filter((dataset) => dataset.hasNumericValue)
        .map(({ label, data }) => ({ label, data }));

    if (!datasets.length) {
        return null;
    }

    return { labels, datasets };
}

function ResultsChart({ result, emptyMessage }: ResultsChartProps): React.JSX.Element {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const hasChartData = result ? chartRows(result) !== null : false;

    useEffect(() => {
        const canvas = canvasRef.current;
        const data = result ? chartRows(result) : null;

        if (!canvas || !data) {
            return;
        }

        const instance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets.map((dataset, index) => ({
                    ...dataset,
                    backgroundColor: ['#002d72', '#005eb8', '#68ace5', '#8eb8e8'][index % 4],
                    borderRadius: 8,
                    maxBarThickness: 42,
                })),
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            color: '#16365c',
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 35,
                            minRotation: 35,
                            color: '#4b6486',
                        },
                        grid: {
                            display: false,
                        },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#4b6486',
                        },
                        grid: {
                            color: 'rgba(0, 45, 114, 0.08)',
                        },
                    },
                },
            },
        });

        return () => {
            instance.destroy();
        };
    }, [result]);

    return (
        <div className="h-[320px] overflow-hidden rounded-xl border border-border bg-white p-4 shadow-sm">
            {hasChartData ? (
                <canvas ref={canvasRef} className="h-full w-full" />
            ) : (
                <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                    {emptyMessage}
                </div>
            )}
        </div>
    );
}

function ResultsTable({ result, fallbackMessage }: ResultsTableProps): React.JSX.Element {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        container.replaceChildren();

        if (!result) {
            const empty = document.createElement('div');
            empty.className = 'table-empty-state';
            empty.textContent = fallbackMessage;
            container.append(empty);
            return;
        }

        if (!result.rows.length) {
            const empty = document.createElement('div');
            empty.className = 'table-empty-state';
            empty.textContent = 'The query ran successfully but returned no rows.';
            container.append(empty);
            return;
        }

        const instance = new Tabulator(container, {
            data: result.rows,
            layout: 'fitColumns',
            maxHeight: '520px',
            columns: result.columns.map((column) => ({
                title: column,
                field: column,
                formatter: (cell: { getValue: () => RowValue }) => String(cell.getValue() ?? ''),
                headerSort: false,
            })),
        });

        return () => {
            instance.destroy();
        };
    }, [fallbackMessage, result]);

    return <div ref={containerRef} className="tabulator-shell overflow-hidden rounded-xl border border-border bg-white" />;
}

function App({ initialTitle }: { initialTitle: string }): React.JSX.Element {
    const [appTitle, setAppTitle] = useState(initialTitle);
    const [catalog, setCatalog] = useState<QueryDefinition[]>([]);
    const [selectedQueryId, setSelectedQueryId] = useState('');
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [latestResult, setLatestResult] = useState<QueryResult | null>(null);
    const [statusText, setStatusText] = useState('Loading query catalog...');
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [runError, setRunError] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const selectedQuery = catalog.find((query) => query.id === selectedQueryId) ?? null;

    useEffect(() => {
        document.title = appTitle;
    }, [appTitle]);

    useEffect(() => {
        let cancelled = false;

        async function loadCatalog(): Promise<void> {
            setStatusText('Loading query catalog...');
            setCatalogError(null);

            try {
                const payload = await fetchJson<CatalogResponse>(apiUrl('catalog'));

                if (!payload.queries.length) {
                    throw new Error('No queries were returned by the backend.');
                }

                if (cancelled) {
                    return;
                }

                setAppTitle(payload.appTitle || initialTitle);
                setCatalog(payload.queries);
                setSelectedQueryId(payload.queries[0].id);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                const message = error instanceof Error ? error.message : 'Unable to load the interface.';
                setCatalog([]);
                setSelectedQueryId('');
                setCatalogError(message);
                setLatestResult(null);
                setRunError(null);
                setStatusText(message);
            }
        }

        void loadCatalog();

        return () => {
            cancelled = true;
        };
    }, [initialTitle]);

    useEffect(() => {
        if (!selectedQuery) {
            return;
        }

        setFormValues(defaultFormValues(selectedQuery));
        setLatestResult(null);
        setRunError(null);
        setStatusText('Parameters ready.');
    }, [selectedQuery]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        if (!selectedQuery) {
            return;
        }

        setIsRunning(true);
        setRunError(null);
        setStatusText('Running query...');

        try {
            const result = await fetchJson<QueryResult>(apiUrl('run'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    queryId: selectedQuery.id,
                    params: formValues,
                }),
            });

            setLatestResult(result);
            setStatusText('Query complete.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unexpected error';
            setLatestResult(null);
            setRunError(message);
            setStatusText(message);
        } finally {
            setIsRunning(false);
        }
    }

    const queryTitle = selectedQuery
        ? `${selectedQuery.number}. ${selectedQuery.title}`
        : catalogError
          ? 'Catalog unavailable'
          : 'Loading...';

    const querySummary = selectedQuery?.summary ?? catalogError ?? 'Loading query catalog...';

    const tableSummary = latestResult
        ? `${latestResult.rowCount} row(s) returned in ${latestResult.durationMs} ms.`
        : runError
          ? 'No results available.'
          : selectedQuery
            ? 'Run the selected analysis to populate the result grid.'
            : 'No query available.';

    const chartCaption = latestResult
        ? 'Chart.js plots up to the first 12 rows returned from the database.'
        : runError
          ? 'The latest query failed before chart data could be produced.'
          : 'Charts appear automatically when the query returns numeric columns.';

    const chartEmptyMessage = runError
        ? 'The query failed. Check your backend and database settings.'
        : latestResult
          ? 'This result set did not expose numeric fields that can be charted.'
          : selectedQuery
            ? 'Run the selected query to render a chart.'
            : catalogError ?? 'Loading query catalog...';

    const tableFallbackMessage = runError
        ? runError
        : selectedQuery
          ? 'Run the selected query to load results.'
          : catalogError ?? 'Loading query catalog...';

    const queryCountLabel = catalog.length === 1 ? '1 preset query' : `${catalog.length} preset queries`;

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-white/10 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <main className="mx-auto flex w-full max-w-7xl items-end justify-between gap-6 px-4 py-8 md:px-6 lg:px-8">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">
                            Johns Hopkins Theme
                        </p>
                        <h1 className="font-display text-4xl leading-none md:text-5xl">{appTitle}</h1>
                    </div>
                    <div className="hidden rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-right md:block">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">Catalog</p>
                        <p className="mt-1 text-lg font-semibold text-white">{queryCountLabel}</p>
                    </div>
                </main>
            </div>

            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
                <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <Card className="border-border bg-card shadow-sm">
                        <CardHeader className="gap-1">
                            <CardTitle className="font-display text-2xl text-foreground">Queries</CardTitle>
                            <CardDescription>Select one query from your preset list.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[640px] pr-4">
                                <div className="space-y-3">
                                    {catalog.map((query) => (
                                        <button
                                            key={query.id}
                                            type="button"
                                            className={cn(
                                                'w-full rounded-xl border border-border bg-white px-4 py-4 text-left transition hover:border-primary/35 hover:bg-secondary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                selectedQueryId === query.id &&
                                                    'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                            )}
                                            onClick={() => setSelectedQueryId(query.id)}
                                        >
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <span
                                                    className={cn(
                                                        'inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
                                                        selectedQueryId === query.id
                                                            ? 'bg-white/14 text-white'
                                                            : 'bg-secondary text-primary'
                                                    )}
                                                >
                                                    {query.number}
                                                </span>
                                                <Gauge
                                                    className={cn(
                                                        'h-4 w-4',
                                                        selectedQueryId === query.id ? 'text-white/75' : 'text-muted-foreground'
                                                    )}
                                                />
                                            </div>
                                            <h3
                                                className={cn(
                                                    'text-base font-semibold',
                                                    selectedQueryId === query.id ? 'text-white' : 'text-foreground'
                                                )}
                                            >
                                                {query.title}
                                            </h3>
                                            <p
                                                className={cn(
                                                    'mt-2 text-sm leading-6',
                                                    selectedQueryId === query.id ? 'text-white/78' : 'text-muted-foreground'
                                                )}
                                            >
                                                {query.summary}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="border-border bg-card shadow-sm">
                            <CardHeader>
                                <div className="space-y-4">
                                    <div>
                                        <CardTitle className="font-display text-3xl leading-tight text-foreground">
                                            {queryTitle}
                                        </CardTitle>
                                        <CardDescription className="mt-2 max-w-3xl leading-6">
                                            {querySummary}
                                        </CardDescription>
                                    </div>
                                    <Separator />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {selectedQuery?.inputs.map((input) => (
                                            <label key={input.name} className="space-y-2">
                                                <span className="text-sm font-semibold text-foreground">{input.label}</span>
                                                <Input
                                                    id={input.name}
                                                    name={input.name}
                                                    type={input.type}
                                                    value={formValues[input.name] ?? String(input.default)}
                                                    onChange={(event) =>
                                                        setFormValues((current) => ({
                                                            ...current,
                                                            [input.name]: event.currentTarget.value,
                                                        }))
                                                    }
                                                    min={input.type === 'number' ? input.min : undefined}
                                                    max={input.type === 'number' ? input.max : undefined}
                                                    step={input.type === 'number' ? '1' : undefined}
                                                    className="h-11 rounded-lg border-border bg-white"
                                                />
                                            </label>
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-4 rounded-xl border border-border bg-secondary/55 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Status</p>
                                            <p className="mt-1 text-sm text-muted-foreground">{statusText}</p>
                                        </div>
                                        <Button type="submit" disabled={!selectedQuery || isRunning} className="rounded-lg px-6">
                                            <Play className="size-4" />
                                            {isRunning ? 'Running...' : 'Run Query'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
                            <Card className="border-border bg-card shadow-sm">
                                <CardHeader className="gap-2">
                                    <div className="flex items-center gap-2 text-primary">
                                        <BarChart3 className="size-4" />
                                        <span className="text-xs font-semibold uppercase tracking-[0.22em]">Chart</span>
                                    </div>
                                    <CardTitle className="font-display text-2xl">Visualization</CardTitle>
                                    <CardDescription>{chartCaption}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResultsChart result={latestResult} emptyMessage={chartEmptyMessage} />
                                </CardContent>
                            </Card>

                            <Card className="border-border bg-card shadow-sm">
                                <CardHeader className="gap-2">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Table2 className="size-4" />
                                        <span className="text-xs font-semibold uppercase tracking-[0.22em]">Table</span>
                                    </div>
                                    <CardTitle className="font-display text-2xl">Result Table</CardTitle>
                                    <CardDescription>{tableSummary}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResultsTable
                                        result={latestResult}
                                        fallbackMessage={tableFallbackMessage}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export { App };
