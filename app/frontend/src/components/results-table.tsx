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

function ResultsTable({ columns, rows, hasResult, fallbackMessage }: ResultsTableProps): JSX.Element {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !hasResult || !rows.length) {
            return;
        }

        container.replaceChildren();

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
            instance.destroy();
        };
    }, [columns, fallbackMessage, hasResult, rows]);

    if (!hasResult) {
        return (
            <div className="flex min-h-[280px] items-center justify-center rounded-md border px-6 py-8 text-center text-sm text-muted-foreground">
                {fallbackMessage}
            </div>
        );
    }

    if (!rows.length) {
        return (
            <div className="flex min-h-[280px] items-center justify-center rounded-md border px-6 py-8 text-center text-sm text-muted-foreground">
                The query ran successfully but returned no rows.
            </div>
        );
    }

    return <div ref={containerRef} className="overflow-hidden rounded-md border" />;
}

export { ResultsTable };
