import { LoaderCircle } from 'lucide-react';
import type { JSX } from 'react';

import { useQueryLoadingOverlayStore } from '@/hooks/use-query-explorer';

function QueryLoadingOverlay(): JSX.Element | null {
    const { isRunning } = useQueryLoadingOverlayStore();

    if (!isRunning) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="query-loading-title"
        >
            <div className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-lg">
                <div className="flex flex-col items-center gap-4 text-center">
                    <LoaderCircle className="size-12 animate-spin text-primary" aria-hidden="true" />
                    <div className="space-y-2">
                        <h2 id="query-loading-title" className="text-lg font-semibold">
                            Query is loading
                        </h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Please wait while the results are prepared.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { QueryLoadingOverlay };
