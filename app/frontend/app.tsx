import './styles.css';
import 'tabulator-tables/dist/css/tabulator.min.css';
import Chart from 'chart.js/auto';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
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
    tableRef: React.MutableRefObject<Tabulator | null>;
}

function defaultFormValues(query: QueryDefinition): Record<string, string> {
    return Object.fromEntries(
        query.inputs.map((input) => [input.name, String(input.default)])
    );
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
        result.chart.labelColumns.map((column) => String(row[column] ?? '')).filter(Boolean).join(' • ')
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
                    backgroundColor: ['#1d5b52', '#c0792d', '#485a7a', '#7b4f5d'][index % 4],
                    borderRadius: 6,
                })),
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                },
                scales: {
                    x: {
                        ticks: { maxRotation: 45, minRotation: 45 },
                    },
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });

        return () => {
            instance.destroy();
        };
    }, [result]);

    return (
        <div className="chart-wrap">
            {hasChartData ? (
                <canvas ref={canvasRef} className="results-chart" />
            ) : (
                <div className="chart-empty">{emptyMessage}</div>
            )}
        </div>
    );
}

function ResultsTable({ result, fallbackMessage, tableRef }: ResultsTableProps): React.JSX.Element {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        container.replaceChildren();

        if (!result) {
            const empty = document.createElement('div');
            empty.className = 'table-empty';
            empty.textContent = fallbackMessage;
            container.append(empty);
            tableRef.current = null;
            return;
        }

        if (!result.rows.length) {
            const empty = document.createElement('div');
            empty.className = 'table-empty';
            empty.textContent = 'The query ran successfully but returned no rows.';
            container.append(empty);
            tableRef.current = null;
            return;
        }

        const instance = new Tabulator(container, {
            data: result.rows,
            layout: 'fitColumns',
            maxHeight: '560px',
            columns: result.columns.map((column) => ({
                title: column,
                field: column,
                formatter: (cell: { getValue: () => RowValue }) => String(cell.getValue() ?? ''),
                headerSort: false,
            })),
        });

        tableRef.current = instance;

        return () => {
            if (tableRef.current === instance) {
                tableRef.current = null;
            }
            instance.destroy();
        };
    }, [fallbackMessage, result, tableRef]);

    return <div ref={containerRef} className="table-wrap" />;
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
    const tableRef = useRef<Tabulator | null>(null);

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
                const payload = await fetchJson<CatalogResponse>('./api.php?action=catalog');

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
            const result = await fetchJson<QueryResult>('./api.php?action=run', {
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

    function handleDownload(): void {
        if (!tableRef.current || !latestResult || latestResult.rowCount === 0) {
            return;
        }

        tableRef.current.download('csv', `${latestResult.query.id}_results.csv`);
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
            ? 'Ready to run.'
            : 'No query available.';

    const chartCaption = latestResult
        ? 'Chart.js uses up to the first 12 returned rows.'
        : runError
          ? 'The query failed. Check your database settings and try again.'
          : 'Charts appear when numeric results are available.';

    const chartEmptyMessage = runError
        ? 'The query failed. Check your database settings and try again.'
        : latestResult
          ? 'No chartable values were returned for this query.'
          : selectedQuery
            ? 'Choose parameters and run the query to render a chart.'
            : catalogError ?? 'Loading query catalog...';

    const tableFallbackMessage = runError
        ? runError
        : selectedQuery
          ? 'Run the selected query to load results.'
          : catalogError ?? 'Loading query catalog...';

    const sqlPreview = latestResult
        ? `${latestResult.sql}\n\n-- Bound parameters: ${JSON.stringify(latestResult.params)}`
        : runError
          ? 'The last request failed before SQL results could be rendered.'
          : 'Run the query to display the SQL sent to MySQL.';

    return (
        <>
            <div className="background-orb orb-one"></div>
            <div className="background-orb orb-two"></div>
            <main className="app-shell">
                <header className="hero">
                    <div className="hero-copy">
                        <p className="eyebrow">Phase III Draft Interface</p>
                        <h1>{appTitle}</h1>
                        <p className="hero-text">
                            Explore the 15 analytical SQL questions from the Steam project through a
                            single launch page. The UI is now React-rendered, while PHP still powers
                            the backend API and MySQL query execution.
                        </p>
                    </div>
                    <section className="hero-card">
                        <h2>How To Use</h2>
                        <ol>
                            <li>Select one of the query options from the menu.</li>
                            <li>Adjust the available parameters for the chosen analysis.</li>
                            <li>Run the query to view the table, chart, SQL text, and downloadable result set.</li>
                        </ol>
                    </section>
                </header>

                <section className="dashboard-grid">
                    <aside className="panel menu-panel">
                        <div className="panel-header">
                            <div>
                                <h2>Query Menu</h2>
                                <p>{catalog.length} course-aligned analysis options</p>
                            </div>
                        </div>
                        <div className="query-list" aria-label="Query menu">
                            {catalog.map((query) => (
                                <button
                                    key={query.id}
                                    type="button"
                                    className={`query-card${selectedQueryId === query.id ? ' active' : ''}`}
                                    onClick={() => setSelectedQueryId(query.id)}
                                >
                                    <span className="query-card-number">{query.number}</span>
                                    <h3>{query.title}</h3>
                                    <p className="query-meta">{query.summary}</p>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <section className="panel workspace-panel">
                        <div className="panel-header">
                            <div>
                                <p className="section-kicker">Selected Analysis</p>
                                <h2>{queryTitle}</h2>
                            </div>
                            <button
                                className="ghost-button"
                                type="button"
                                onClick={handleDownload}
                                disabled={!latestResult || latestResult.rowCount === 0 || isRunning}
                            >
                                Download CSV
                            </button>
                        </div>

                        <p className="query-summary">{querySummary}</p>

                        <form className="query-form" onSubmit={(event) => void handleSubmit(event)}>
                            <div className="query-inputs">
                                {selectedQuery?.inputs.map((input) => (
                                    <div key={input.name} className="field">
                                        <label htmlFor={input.name}>{input.label}</label>
                                        <input
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
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="form-actions">
                                <button
                                    className="primary-button"
                                    type="submit"
                                    disabled={!selectedQuery || isRunning}
                                >
                                    {isRunning ? 'Running…' : 'Run Query'}
                                </button>
                                <span className="status-text" aria-live="polite">
                                    {statusText}
                                </span>
                            </div>
                        </form>

                        <div className="results-grid">
                            <section className="result-card">
                                <div className="result-card-header">
                                    <h3>Visualization</h3>
                                    <p>{chartCaption}</p>
                                </div>
                                <ResultsChart result={latestResult} emptyMessage={chartEmptyMessage} />
                            </section>

                            <section className="result-card">
                                <div className="result-card-header">
                                    <h3>Result Table</h3>
                                    <p>{tableSummary}</p>
                                </div>
                                <ResultsTable
                                    result={latestResult}
                                    fallbackMessage={tableFallbackMessage}
                                    tableRef={tableRef}
                                />
                            </section>
                        </div>

                        <section className="result-card sql-card">
                            <div className="result-card-header">
                                <h3>SQL Used</h3>
                                <p>This mirrors the Phase III analytical workload with safe parameterization.</p>
                            </div>
                            <pre className="sql-preview">{sqlPreview}</pre>
                        </section>
                    </section>
                </section>
            </main>
        </>
    );
}

const rootNode = document.querySelector<HTMLDivElement>('#app-root');

if (!rootNode) {
    throw new Error('Missing required node: #app-root');
}

createRoot(rootNode).render(<App initialTitle={rootNode.dataset.appTitle ?? 'Steam Discovery Dashboard'} />);
