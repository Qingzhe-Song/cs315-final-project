import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';

import type { RowValue } from '@/types';

interface ResultsTableProps {
    columns: string[];
    rows: Record<string, RowValue>[];
    hasResult: boolean;
    fallbackMessage: string;
}

// mounts tabulator for sortable-looking but fixed-header result tables.
function ResultsTable({ columns, rows, hasResult, fallbackMessage }: ResultsTableProps): JSX.Element {
    // tabulator needs a real element outside react's normal table rendering.
    const containerRef = useRef<HTMLDivElement | null>(null);

    // recreates the tabulator table whenever result data changes.
    useEffect(() => {
        const container = containerRef.current;
        // waits until a successful result with rows exists.
        if (!container || !hasResult || !rows.length) {
            return;
        }

        // clears old tabulator markup before creating a fresh instance.
        container.replaceChildren();

        // maps backend columns into tabulator column definitions.
        const instance = new Tabulator(container, {
            data: rows,
            layout: 'fitColumns',
            maxHeight: '520px',
            columns: columns.map((column) => ({
                title: column,
                field: column,
                formatter: (cell: { getValue: () => RowValue }) => String(cell.getValue() ?? ''),
                headerSort: false,
            })),
        });

        return () => {
            // destroys tabulator so it releases dom listeners and state.
            instance.destroy();
        };
    }, [columns, fallbackMessage, hasResult, rows]);

    // before any query runs, show the store-provided helper message.
    if (!hasResult) {
        return (
            <div className="flex min-h-[280px] items-center justify-center rounded-md border px-6 py-8 text-center text-sm text-muted-foreground">
                {fallbackMessage}
            </div>
        );
    }

    // successful empty results get a distinct message from the idle state.
    if (!rows.length) {
        return (
            <div className="flex min-h-[280px] items-center justify-center rounded-md border px-6 py-8 text-center text-sm text-muted-foreground">
                The query ran successfully but returned no rows.
            </div>
        );
    }

    // tabulator fills this container once the effect runs.
    return <div ref={containerRef} className="overflow-hidden rounded-md border" />;
}

export { ResultsTable };
