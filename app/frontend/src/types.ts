export type InputType = 'number' | 'text';
export type QueryStatus = 'ready' | 'loading' | 'complete' | 'error';
export type QueryMode = 'preset' | 'custom';
export type RowValue = string | number | null;

export interface QueryInput {
    name: string;
    label: string;
    type: InputType;
    default: string | number;
}

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

export interface QueryDefinition {
    id: string;
    number: number;
    title: string;
    summary: string;
    inputs: QueryInput[];
    chart: ChartConfig;
}

export interface QueryExecutionResponse {
    columns: string[];
    rows: Record<string, RowValue>[];
    rowCount: number;
    sql: string;
    params: Array<string | number>;
    durationMs: number;
}

export interface QueryResult extends QueryExecutionResponse {
    query: QueryDefinition;
}
