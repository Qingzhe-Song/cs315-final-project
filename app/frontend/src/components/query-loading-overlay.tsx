import { LoaderCircle } from 'lucide-react';
import type { JSX } from 'react';

import { useQueryLoadingOverlayStore } from '@/hooks/use-query-explorer';

// shows a blocking dialog while the backend is preparing query results.
function QueryLoadingOverlay(): JSX.Element | null {
    // reads only the running flag so the overlay stays lightweight.
    const { isRunning } = useQueryLoadingOverlayStore();

    // renders nothing when the app is idle.
    if (!isRunning) {
        return null;
    }

    return (
        /* dialog semantics make the loading state clear to assistive tech. */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="query-loading-title"
        >
            <div className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-lg">
                {/* spinner and message keep the wait state visually centered. */}
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
