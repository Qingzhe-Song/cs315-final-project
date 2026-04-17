import { useEffect } from 'react';
import type { JSX } from 'react';

import { QueryCatalog } from '@/components/query-catalog';
import { QueryFormCard } from '@/components/query-form-card';
import { ResultsSection } from '@/components/results-section';
import { useAppTitleStore } from '@/hooks/use-query-explorer';
import { initializeApp } from '@/stores/query-explorer';

function App({ initialTitle }: { initialTitle: string }): JSX.Element {
    const appTitle = useAppTitleStore();

    useEffect(() => {
        document.title = appTitle;
    }, [appTitle]);

    useEffect(() => {
        void initializeApp(initialTitle);
    }, [initialTitle]);

    return (
        <div className="min-h-screen bg-background">
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
                <header className="space-y-2">
                    <p className="text-sm text-muted-foreground">SQL query explorer</p>
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{appTitle}</h1>
                </header>

                <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <QueryCatalog />

                    <div className="space-y-6">
                        <QueryFormCard />
                        <ResultsSection />
                    </div>
                </section>
            </main>
        </div>
    );
}

export { App };
