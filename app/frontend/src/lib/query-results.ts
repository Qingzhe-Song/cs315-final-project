import type { QueryDefinition, QueryResult } from '@/types';

export interface ChartRows {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
    }>;
}

export const INITIAL_ROW_COUNT = 20;
export const ROWS_INCREMENT = 20;

export function defaultFormValues(query: QueryDefinition): Record<string, string> {
    return Object.fromEntries(query.inputs.map((input) => [input.name, String(input.default)]));
}

export function getChartRows(result: QueryResult): ChartRows | null {
    if (!result.rows.length || !result.query.chart.valueColumns.length) {
        return null;
    }

    const rows = result.rows.slice(0, 12);
    const labels = rows.map((row) =>
        result.query.chart.labelColumns
            .map((column) => String(row[column] ?? ''))
            .filter(Boolean)
            .join(' • ')
    );

    const datasets = result.query.chart.valueColumns
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
