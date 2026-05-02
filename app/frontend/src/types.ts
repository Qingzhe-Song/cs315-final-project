// input types supported by preset query forms.
export type InputType = 'number' | 'text';
// query status values shown in the form status line.
export type QueryStatus = 'ready' | 'loading' | 'complete' | 'error';
// query mode controls whether preset or custom ui is visible.
export type QueryMode = 'preset' | 'custom';
// rows can contain strings, numbers, or nulls from mysql.
export type RowValue = string | number | null;

// describes one editable input for a preset query.
export interface QueryInput {
    name: string;
    label: string;
    type: InputType;
    default: string | number;
}

// describes how a query result should be visualized.
export interface ChartConfig {
    type: 'bar' | 'line' | 'scatter' | 'bubble' | 'doughnut';
    labelColumns?: string[];
    valueColumns?: string[];
    xColumn?: string;
    yColumn?: string;
    radiusColumn?: string;
    seriesColumn?: string;
    indexAxis?: 'x' | 'y';
    categoryOrder?: string[];
    rightAxisColumns?: string[];
}

// catalog entry used to render a query card, form, and chart.
export interface QueryDefinition {
    id: string;
    number: number;
    title: string;
    summary: string;
    inputs: QueryInput[];
    chart: ChartConfig;
}

// raw backend response shared by preset and custom query endpoints.
export interface QueryExecutionResponse {
    columns: string[];
    rows: Record<string, RowValue>[];
    rowCount: number;
    sql: string;
    params: Array<string | number>;
}

// frontend result enriches the backend response with catalog metadata.
export interface QueryResult extends QueryExecutionResponse {
    query: QueryDefinition;
}
