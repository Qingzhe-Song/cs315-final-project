export type InputType = 'number' | 'text';
export type RowValue = string | number | null;

export interface QueryInput {
    name: string;
    label: string;
    type: InputType;
    default: string | number;
    min?: number;
    max?: number;
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

export interface CatalogResponse {
    appTitle: string;
    queries: QueryDefinition[];
}

export interface QueryResult {
    query: {
        id: string;
        number: number;
        title: string;
        summary: string;
    };
    columns: string[];
    rows: Record<string, RowValue>[];
    rowCount: number;
    chart: ChartConfig;
    sql: string;
    params: Array<string | number>;
    durationMs: number;
}
