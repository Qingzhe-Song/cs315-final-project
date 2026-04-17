import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent, JSX } from 'react';

import { QueryCatalog } from '@/components/query-catalog';
import { QueryFormCard } from '@/components/query-form-card';
import { ResultsSection } from '@/components/results-section';
import { fetchJson, apiUrl } from '@/lib/api';
import { defaultFormValues } from '@/lib/query-results';

import type { CatalogResponse, QueryDefinition, QueryResult } from './types';

function App({ initialTitle }: { initialTitle: string }): JSX.Element {
    const [appTitle, setAppTitle] = useState(initialTitle);
    const [catalog, setCatalog] = useState<QueryDefinition[]>([]);
    const [selectedQueryId, setSelectedQueryId] = useState('');
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [latestResult, setLatestResult] = useState<QueryResult | null>(null);
    const [statusText, setStatusText] = useState('Loading query catalog...');
    const [isRunning, setIsRunning] = useState(false);
    const [showVisualization, setShowVisualization] = useState(false);

    const selectedQuery = catalog.find((query) => query.id === selectedQueryId) ?? null;

    useEffect(() => {
        document.title = appTitle;
    }, [appTitle]);

    useEffect(() => {
        async function loadCatalog(): Promise<void> {
            setStatusText('Loading query catalog...');
            const payload = await fetchJson<CatalogResponse>(apiUrl('catalog'));
            setAppTitle(payload.appTitle || initialTitle);
            setCatalog(payload.queries);
            setSelectedQueryId(payload.queries[0]?.id ?? '');
        }

        void loadCatalog();
    }, [initialTitle]);

    useEffect(() => {
        if (!selectedQuery) {
            return;
        }

        setFormValues(defaultFormValues(selectedQuery));
        setLatestResult(null);
        setShowVisualization(false);
        setStatusText('Parameters ready.');
    }, [selectedQuery]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        setIsRunning(true);
        setShowVisualization(false);
        setStatusText('Running query...');

        try {
            const result = await fetchJson<QueryResult>(apiUrl('run'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    queryId: selectedQuery?.id,
                    params: formValues,
                }),
            });

            setLatestResult(result);
            setStatusText('Query complete.');
        } catch {
            setLatestResult(null);
            setShowVisualization(false);
            setStatusText('Request failed.');
        } finally {
            setIsRunning(false);
        }
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
        const { name, value } = event.currentTarget;
        setFormValues((current) => ({
            ...current,
            [name]: value,
        }));
    }

    const visibleRows = latestResult?.rows ?? [];
    const visibleRowTotal = latestResult ? visibleRows.length : 0;

    const queryTitle = selectedQuery
        ? `${selectedQuery.number}. ${selectedQuery.title}`
        : 'Loading...';

    const querySummary = selectedQuery?.summary ?? 'Loading query catalog...';

    const tableSummary = latestResult
        ? `${visibleRowTotal} of ${latestResult.rowCount} row(s) shown in ${latestResult.durationMs} ms.`
        : selectedQuery
          ? 'Run the selected analysis to populate the result grid.'
          : 'No query available.';

    const chartCaption = latestResult
        ? 'Chart.js plots up to the first 12 rows returned from the database.'
        : 'Run a query, review the table, then open the visualization if you need it.';

    const chartEmptyMessage = latestResult
        ? 'This result set did not expose numeric fields that can be charted.'
        : selectedQuery
          ? 'Run the selected query to render a chart.'
          : 'Loading query catalog...';

    const tableFallbackMessage = selectedQuery
        ? 'Run the selected query to load results.'
        : 'Loading query catalog...';

    return (
        <div className="min-h-screen bg-background">
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
                <header className="space-y-2">
                    <p className="text-sm text-muted-foreground">SQL query explorer</p>
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{appTitle}</h1>
                </header>

                <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <QueryCatalog
                        catalog={catalog}
                        selectedQueryId={selectedQueryId}
                        onSelect={setSelectedQueryId}
                    />

                    <div className="space-y-6">
                        <QueryFormCard
                            queryTitle={queryTitle}
                            querySummary={querySummary}
                            selectedQuery={selectedQuery}
                            formValues={formValues}
                            statusText={statusText}
                            isRunning={isRunning}
                            onInputChange={handleInputChange}
                            onSubmit={(event) => void handleSubmit(event)}
                        />

                        <ResultsSection
                            result={latestResult}
                            visibleRows={visibleRows}
                            visibleRowTotal={visibleRowTotal}
                            showVisualization={showVisualization}
                            tableSummary={tableSummary}
                            tableFallbackMessage={tableFallbackMessage}
                            chartCaption={chartCaption}
                            chartEmptyMessage={chartEmptyMessage}
                            onToggleVisualization={() => setShowVisualization((current) => !current)}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
}

export { App };
