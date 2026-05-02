import { useEffect } from 'react';
import type { JSX } from 'react';

import { CustomQueryCard } from '@/components/custom-query-card';
import { QueryCatalog } from '@/components/query-catalog';
import { QueryFormCard } from '@/components/query-form-card';
import { QueryLoadingOverlay } from '@/components/query-loading-overlay';
import { ResultsSection } from '@/components/results-section';
import { Button } from '@/components/ui/button';
import { useAppTitleStore, useQueryModeStore } from '@/hooks/use-query-explorer';
import { initializeApp } from '@/stores/query-explorer';

// renders the main dashboard shell and switches between query modes.
function App({ initialTitle }: { initialTitle: string }): JSX.Element {
    // reads the shared title and active mode from nanostore-backed hooks.
    const appTitle = useAppTitleStore();
    const { queryMode, setQueryMode } = useQueryModeStore();

    // keeps the browser tab title aligned with the visible app title.
    useEffect(() => {
        document.title = appTitle;
    }, [appTitle]);

    // initializes the catalog once the server-provided title is available.
    useEffect(() => {
        void initializeApp(initialTitle);
    }, [initialTitle]);

    return (
        <div className="min-h-screen bg-background">
            {/* shows a modal overlay whenever a query is running. */}
            <QueryLoadingOverlay />
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
                <header className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{appTitle}</h1>
                </header>

                {/* lets users toggle between stored procedures and custom filters. */}
                <nav className="flex w-full flex-col gap-2 sm:w-fit sm:flex-row">
                    <Button
                        type="button"
                        variant={queryMode === 'preset' ? 'secondary' : 'ghost'}
                        className="cursor-pointer border border-transparent hover:border-border hover:bg-accent hover:shadow-sm"
                        onClick={() => setQueryMode('preset')}
                    >
                        Preset Queries
                    </Button>
                    <Button
                        type="button"
                        variant={queryMode === 'custom' ? 'secondary' : 'ghost'}
                        className="cursor-pointer border border-transparent hover:border-border hover:bg-accent hover:shadow-sm"
                        onClick={() => setQueryMode('custom')}
                    >
                        Custom Queries
                    </Button>
                </nav>

                {/* preset mode shows the catalog beside the form and results. */}
                {queryMode === 'preset' ? (
                    <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                        <QueryCatalog />

                        <div className="space-y-6">
                            <QueryFormCard />
                            <ResultsSection />
                        </div>
                    </section>
                ) : (
                    /* custom mode uses one filter form above the same results area. */
                    <section className="space-y-6">
                        <CustomQueryCard />
                        <ResultsSection />
                    </section>
                )}
            </main>
        </div>
    );
}

export { App };
