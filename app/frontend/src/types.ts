export type InputType = 'number' | 'text';
export type QueryMode = 'preset' | 'custom';
export type RowValue = string | number | null;

export interface QueryInput {
    name: string;
    label: string;
    type: InputType;
    default: string | number;
}

export interface ChartConfig {
    labelColumns: string[];
    valueColumns: string[];
    type: 'bar';
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
