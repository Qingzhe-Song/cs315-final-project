import type { QueryDefinition, QueryResult } from '@/types';

// point shape used by scatter and bubble charts.
export interface ChartPoint {
    x: number;
    y: number;
    r?: number;
    label: string;
}

// normalized chart data shape consumed by results-chart.
export interface ChartRows {
    labels: string[];
    datasets: Array<{
        label: string;
        data: Array<number | null | ChartPoint>;
        yAxisID?: 'y' | 'y1';
    }>;
}

// table paging constants are kept here with other result helpers.
export const INITIAL_ROW_COUNT = 20;
export const ROWS_INCREMENT = 20;

// keeps the requested chart row count inside the available result range.
export function clampChartRowLimit(rowLimit: number, rowCount: number): number {
    // no rows means the chart should not request anything.
    if (rowCount <= 0) {
        return 0;
    }

    // invalid input falls back to showing all fetched rows.
    if (!Number.isFinite(rowLimit)) {
        return rowCount;
    }

    return Math.min(Math.max(1, Math.floor(rowLimit)), rowCount);
}

// creates string form values from catalog input defaults.
export function defaultFormValues(query: QueryDefinition): Record<string, string> {
    return Object.fromEntries(query.inputs.map((input) => [input.name, String(input.default)]));
}

// joins configured label columns into a readable chart label.
function labelForRow(row: QueryResult['rows'][number], columns: string[] = []): string {
    return columns
        .map((column) => String(row[column] ?? ''))
        .filter(Boolean)
        .join(' • ');
}

// converts a row value to a finite number or rejects it for charting.
function numberFromRow(row: QueryResult['rows'][number], column: string): number | null {
    const value = Number(row[column]);
    return Number.isFinite(value) ? value : null;
}

// removes duplicate category values and applies configured ordering.
function uniqueValues(values: string[], categoryOrder?: string[]): string[] {
    const unique = [...new Set(values)];

    // explicit category order wins when the query definition provides it.
    if (categoryOrder?.length) {
        return unique.sort((a, b) => {
            const aIndex = categoryOrder.indexOf(a);
            const bIndex = categoryOrder.indexOf(b);

            // unknown labels keep their relative order behind known labels.
            if (aIndex === -1 && bIndex === -1) {
                return 0;
            }

            if (aIndex === -1) {
                return 1;
            }

            if (bIndex === -1) {
                return -1;
            }

            return aIndex - bIndex;
        });
    }

    // numeric-looking labels are sorted numerically for timelines and buckets.
    if (unique.every((value) => Number.isFinite(Number(value)))) {
        return unique.sort((a, b) => Number(a) - Number(b));
    }

    return unique;
}

// slices rows to the chart limit and sorts single-label charts when needed.
function sortedRows(result: QueryResult, rowLimit: number): QueryResult['rows'] {
    const { categoryOrder, labelColumns, type } = result.query.chart;
    const rows = result.rows.slice(0, clampChartRowLimit(rowLimit, result.rows.length));

    // only one-label ordered charts need extra row sorting.
    if (!labelColumns || labelColumns.length !== 1 || (!categoryOrder?.length && type !== 'line')) {
        return rows;
    }

    const labels = rows.map((row) => String(row[labelColumns[0]] ?? ''));
    const orderedLabels = uniqueValues(labels, categoryOrder);
    const labelIndex = new Map(orderedLabels.map((label, index) => [label, index]));

    // sorts rows by the derived label order so chart labels stay predictable.
    return rows.sort((a, b) => {
        const aLabel = String(a[labelColumns[0]] ?? '');
        const bLabel = String(b[labelColumns[0]] ?? '');
        return (labelIndex.get(aLabel) ?? 0) - (labelIndex.get(bLabel) ?? 0);
    });
}

// scales bubble radius into a readable pixel range.
function bubbleRadius(value: number, min: number, max: number): number {
    // identical values still need a visible bubble size.
    if (max === min) {
        return 10;
    }

    return 5 + ((value - min) / (max - min)) * 13;
}

// converts query results into the chart.js-friendly row structure.
export function getChartRows(result: QueryResult, rowLimit = result.rows.length): ChartRows | null {
    // empty result sets cannot produce chart data.
    if (!result.rows.length) {
        return null;
    }

    const { chart } = result.query;
    const rows = sortedRows(result, rowLimit);

    // scatter and bubble charts require x and y numeric coordinates.
    if ((chart.type === 'scatter' || chart.type === 'bubble') && chart.xColumn && chart.yColumn) {
        const points = rows
            .map((row) => ({
                x: numberFromRow(row, chart.xColumn ?? ''),
                y: numberFromRow(row, chart.yColumn ?? ''),
                radiusValue: chart.radiusColumn ? numberFromRow(row, chart.radiusColumn) : null,
                label: labelForRow(row, chart.labelColumns),
            }))
            .filter((point): point is { x: number; y: number; radiusValue: number | null; label: string } => {
                return point.x !== null && point.y !== null;
            });

        // if every row lacks numeric coordinates, there is nothing to chart.
        if (!points.length) {
            return null;
        }

        // bubble charts scale radius from the optional radius metric.
        const radiusValues = points
            .map((point) => point.radiusValue)
            .filter((value): value is number => value !== null);
        const minRadius = radiusValues.length ? Math.min(...radiusValues) : 0;
        const maxRadius = radiusValues.length ? Math.max(...radiusValues) : 0;

        return {
            labels: [],
            datasets: [
                {
                    label: result.query.title,
                    data: points.map((point) => ({
                        x: point.x,
                        y: point.y,
                        r:
                            chart.type === 'bubble' && point.radiusValue !== null
                                ? bubbleRadius(point.radiusValue, minRadius, maxRadius)
                                : undefined,
                        label: point.label,
                    })),
                },
            ],
        };
    }

    // grouped bar and line charts pivot rows into series by category label.
    if ((chart.type === 'bar' || chart.type === 'line') && chart.xColumn && chart.yColumn && chart.seriesColumn) {
        const labels = uniqueValues(
            rows.map((row) => String(row[chart.xColumn ?? ''] ?? '')),
            chart.categoryOrder
        );
        const series = [...new Set(rows.map((row) => String(row[chart.seriesColumn ?? ''] ?? '')))];
        const valueBySeriesAndLabel = new Map<string, number>();

        // map keys combine series and label without risking visible separator collisions.
        rows.forEach((row) => {
            const label = String(row[chart.xColumn ?? ''] ?? '');
            const seriesName = String(row[chart.seriesColumn ?? ''] ?? '');
            const value = numberFromRow(row, chart.yColumn ?? '');

            if (value !== null) {
                valueBySeriesAndLabel.set(`${seriesName}\u0000${label}`, value);
            }
        });

        // removes series that have no numeric values after normalization.
        const datasets = series
            .map((seriesName) => {
                const data = labels.map((label) => valueBySeriesAndLabel.get(`${seriesName}\u0000${label}`) ?? null);
                return {
                    label: seriesName,
                    data,
                    hasNumericValue: data.some((value) => value !== null),
                };
            })
            .filter((dataset) => dataset.hasNumericValue)
            .map(({ label, data }) => ({ label, data }));

        return datasets.length ? { labels, datasets } : null;
    }

    // simple charts need at least one configured numeric value column.
    if (!chart.valueColumns?.length) {
        return null;
    }

    const labels = rows.map((row) => labelForRow(row, chart.labelColumns));

    // doughnut charts use one numeric column as slice sizes.
    if (chart.type === 'doughnut') {
        const column = chart.valueColumns[0];
        const slices = rows
            .map((row) => ({
                label: labelForRow(row, chart.labelColumns),
                value: numberFromRow(row, column),
            }))
            .filter((slice): slice is { label: string; value: number } => slice.value !== null);

        // skips charting when no slice has a numeric value.
        if (!slices.length) {
            return null;
        }

        return {
            labels: slices.map((slice) => slice.label),
            datasets: [
                {
                    label: column,
                    data: slices.map((slice) => slice.value),
                },
            ],
        };
    }

    // bar and line charts can render one dataset per numeric value column.
    const datasets = chart.valueColumns
        .map((column) => {
            let hasNumericValue = false;

            // tracks whether the column contains at least one chartable value.
            const data = rows.map((row) => {
                const value = numberFromRow(row, column);
                if (value !== null) {
                    hasNumericValue = true;
                    return value;
                }

                return null;
            });

            return {
                label: column,
                data,
                yAxisID: (chart.rightAxisColumns?.includes(column) ? 'y1' : 'y') as 'y' | 'y1',
                hasNumericValue,
            };
        })
        .filter((dataset) => dataset.hasNumericValue)
        .map(({ label, data, yAxisID }) => ({ label, data, yAxisID }));

    // rejects charts where all configured value columns were non-numeric.
    if (!datasets.length) {
        return null;
    }

    return { labels, datasets };
}
