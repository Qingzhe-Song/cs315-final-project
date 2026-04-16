import Chart from 'chart.js/auto';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { formParams, mustQuery } from './helpers';
import type { CatalogResponse, QueryDefinition, QueryResult, RowValue } from './types';

const ui = {
    queryList: mustQuery<HTMLDivElement>('#query-list'),
    queryTitle: mustQuery<HTMLElement>('#query-title'),
    querySummary: mustQuery<HTMLElement>('#query-summary'),
    queryForm: mustQuery<HTMLFormElement>('#query-form'),
    queryInputs: mustQuery<HTMLDivElement>('#query-inputs'),
    runButton: mustQuery<HTMLButtonElement>('#run-button'),
    statusText: mustQuery<HTMLElement>('#status-text'),
    tableSummary: mustQuery<HTMLElement>('#table-summary'),
    chartCaption: mustQuery<HTMLElement>('#chart-caption'),
    resultsTable: mustQuery<HTMLDivElement>('#results-table'),
    sqlPreview: mustQuery<HTMLElement>('#sql-preview'),
    downloadButton: mustQuery<HTMLButtonElement>('#download-button'),
    canvas: mustQuery<HTMLCanvasElement>('#results-chart'),
};

const state: {
    catalog: QueryDefinition[];
    selectedQuery: QueryDefinition | null;
    latestResult: QueryResult | null;
    chart: Chart | null;
    table: Tabulator | null;
} = {
    catalog: [],
    selectedQuery: null,
    latestResult: null,
    chart: null,
    table: null,
};

function setStatus(message: string): void {
    ui.statusText.textContent = message;
}

function resetTable(message: string): void {
    state.table?.destroy();
    state.table = null;
    ui.resultsTable.innerHTML = `<div class="table-empty">${message}</div>`;
}

function resetChart(message: string): void {
    state.chart?.destroy();
    state.chart = null;

    const context = ui.canvas.getContext('2d');
    if (!context) return;

    const { width, height } = ui.canvas;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#7d756b';
    context.font = '16px "Avenir Next", "Segoe UI", sans-serif';
    context.textAlign = 'center';
    context.fillText(message, width / 2, height / 2);
}

function chartRows(result: QueryResult): { labels: string[]; datasets: { label: string; data: number[] }[] } | null {
    if (!result.rows.length || !result.chart.valueColumns.length) return null;

    const rows = result.rows.slice(0, 12);
    const labels = rows.map((row) =>
        result.chart.labelColumns.map((column) => String(row[column] ?? '')).filter(Boolean).join(' • ')
    );

    const datasets = result.chart.valueColumns
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
        .filter((dataset) => dataset.hasNumericValue);

    if (!datasets.length) return null;

    return { labels, datasets };
}

function renderChart(result: QueryResult): void {
    const chartData = chartRows(result);
    if (!chartData) {
        resetChart('No chartable values were returned for this query.');
        return;
    }

    state.chart?.destroy();

    state.chart = new Chart(ui.canvas, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: chartData.datasets.map((dataset, index) => ({
                ...dataset,
                backgroundColor: ['#1d5b52', '#c0792d', '#485a7a', '#7b4f5d'][index % 4],
                borderRadius: 6,
            })),
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
            },
            scales: {
                x: {
                    ticks: { maxRotation: 45, minRotation: 45 },
                },
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

function renderTable(result: QueryResult): void {
    state.table?.destroy();
    ui.resultsTable.innerHTML = '';

    if (!result.rows.length) {
        resetTable('The query ran successfully but returned no rows.');
        return;
    }

    state.table = new Tabulator(ui.resultsTable, {
        data: result.rows,
        layout: 'fitColumns',
        maxHeight: '560px',
        columns: result.columns.map((column) => ({
            title: column,
            field: column,
            formatter: (cell: { getValue: () => RowValue }) => String(cell.getValue() ?? ''),
            headerSort: false,
        })),
    });
}

function renderQueryList(): void {
    ui.queryList.innerHTML = '';

    state.catalog.forEach((query) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `query-card${state.selectedQuery?.id === query.id ? ' active' : ''}`;
        button.innerHTML = `
            <span class="query-card-number">${query.number}</span>
            <h3>${query.title}</h3>
            <p class="query-meta">${query.summary}</p>
        `;
        button.addEventListener('click', () => selectQuery(query.id));
        ui.queryList.append(button);
    });
}

function renderInputs(query: QueryDefinition): void {
    ui.queryInputs.innerHTML = '';

    query.inputs.forEach((input) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'field';

        const label = document.createElement('label');
        label.htmlFor = input.name;
        label.textContent = input.label;

        const field = document.createElement('input');
        field.id = input.name;
        field.name = input.name;
        field.type = input.type;
        field.value = String(input.default);
        if (input.type === 'number') {
            field.step = '1';
            if (input.min !== undefined) field.min = String(input.min);
            if (input.max !== undefined) field.max = String(input.max);
        }

        wrapper.append(label, field);
        ui.queryInputs.append(wrapper);
    });
}

function selectQuery(queryId: string): void {
    const query = state.catalog.find((entry) => entry.id === queryId);
    if (!query) return;

    state.selectedQuery = query;
    ui.queryTitle.textContent = `${query.number}. ${query.title}`;
    ui.querySummary.textContent = query.summary;
    ui.sqlPreview.textContent = 'Run the query to display the SQL sent to MySQL.';
    ui.tableSummary.textContent = 'Ready to run.';
    ui.chartCaption.textContent = 'Chart.js will render numeric results when available.';
    ui.downloadButton.disabled = true;

    renderInputs(query);
    renderQueryList();
    resetTable('Run the selected query to load results.');
    resetChart('Choose parameters and run the query to render a chart.');
    setStatus('Parameters ready.');
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const payload = (await response.json()) as T & { error?: string };
    if (!response.ok) throw new Error(payload.error ?? 'Request failed.');
    return payload;
}

async function runSelectedQuery(): Promise<void> {
    if (!state.selectedQuery) return;

    ui.runButton.disabled = true;
    ui.downloadButton.disabled = true;
    setStatus('Running query...');

    try {
        const result = await fetchJson<QueryResult>('./api.php?action=run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                queryId: state.selectedQuery.id,
                params: formParams(ui.queryForm),
            }),
        });

        state.latestResult = result;
        renderTable(result);
        renderChart(result);
        ui.sqlPreview.textContent = `${result.sql}\n\n-- Bound parameters: ${JSON.stringify(result.params)}`;
        ui.tableSummary.textContent = `${result.rowCount} row(s) returned in ${result.durationMs} ms.`;
        ui.chartCaption.textContent = 'Chart.js uses up to the first 12 returned rows.';
        ui.downloadButton.disabled = result.rowCount === 0;
        setStatus('Query complete.');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        state.latestResult = null;
        resetTable(message);
        resetChart('The query failed. Check your database settings and try again.');
        ui.sqlPreview.textContent = 'The last request failed before SQL results could be rendered.';
        ui.tableSummary.textContent = 'No results available.';
        setStatus(message);
    } finally {
        ui.runButton.disabled = false;
    }
}

async function loadCatalog(): Promise<void> {
    setStatus('Loading query catalog...');

    const payload = await fetchJson<CatalogResponse>('./api.php?action=catalog');
    state.catalog = payload.queries;

    if (!state.catalog.length) throw new Error('No queries were returned by the backend.');
    selectQuery(state.catalog[0].id);
}

ui.queryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    void runSelectedQuery();
});

ui.downloadButton.addEventListener('click', () => {
    if (state.table && state.latestResult) {
        state.table.download('csv', `${state.latestResult.query.id}_results.csv`);
    }
});

void loadCatalog().catch((error) => {
    const message = error instanceof Error ? error.message : 'Unable to load the interface.';
    ui.queryTitle.textContent = 'Catalog unavailable';
    ui.querySummary.textContent = message;
    resetTable(message);
    resetChart('The interface could not load the query catalog.');
    setStatus(message);
});
