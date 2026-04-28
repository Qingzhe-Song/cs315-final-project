import Chart from 'chart.js/auto';
import { useEffect, useRef } from 'react';
import type { JSX } from 'react';

import { getChartRows } from '@/lib/query-results';
import type { ChartRows } from '@/lib/query-results';
import type { ChartConfig, QueryResult } from '@/types';

interface ResultsChartProps {
    result: QueryResult | null;
    rowLimit: number;
    emptyMessage: string;
}

const PALETTE = [
    { border: '#2563eb', background: 'rgba(37, 99, 235, 0.65)' },
    { border: '#16a34a', background: 'rgba(22, 163, 74, 0.65)' },
    { border: '#dc2626', background: 'rgba(220, 38, 38, 0.65)' },
    { border: '#9333ea', background: 'rgba(147, 51, 234, 0.65)' },
    { border: '#ea580c', background: 'rgba(234, 88, 12, 0.65)' },
    { border: '#0891b2', background: 'rgba(8, 145, 178, 0.65)' },
    { border: '#be123c', background: 'rgba(190, 18, 60, 0.65)' },
    { border: '#4f46e5', background: 'rgba(79, 70, 229, 0.65)' },
    { border: '#65a30d', background: 'rgba(101, 163, 13, 0.65)' },
    { border: '#a16207', background: 'rgba(161, 98, 7, 0.65)' },
    { border: '#0f766e', background: 'rgba(15, 118, 110, 0.65)' },
    { border: '#c026d3', background: 'rgba(192, 38, 211, 0.65)' },
];

function styleDatasets(datasets: ChartRows['datasets'], chart: ChartConfig): object[] {
    return datasets.map((dataset, index) => {
        const color = PALETTE[index % PALETTE.length];

        if (chart.type === 'doughnut') {
            return {
                ...dataset,
                backgroundColor: dataset.data.map((_, dataIndex) => PALETTE[dataIndex % PALETTE.length].background),
                borderColor: '#ffffff',
                borderWidth: 2,
            };
        }

        if (chart.type === 'line') {
            return {
                ...dataset,
                borderColor: color.border,
                backgroundColor: color.background,
                borderWidth: 2,
                tension: 0.28,
                spanGaps: true,
                pointRadius: 4,
                pointHoverRadius: 6,
            };
        }

        if (chart.type === 'scatter' || chart.type === 'bubble') {
            return {
                ...dataset,
                backgroundColor: color.background,
                borderColor: color.border,
                borderWidth: 1,
                pointRadius: chart.type === 'scatter' ? 5 : undefined,
                pointHoverRadius: chart.type === 'scatter' ? 7 : undefined,
            };
        }

        return {
            ...dataset,
            backgroundColor: color.background,
            borderColor: color.border,
            borderWidth: 1,
            borderRadius: 4,
        };
    });
}

function buildOptions(chart: ChartConfig): object {
    if (chart.type === 'doughnut') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
            },
        };
    }

    const pointChart = chart.type === 'scatter' || chart.type === 'bubble';
    const horizontalBar = chart.type === 'bar' && chart.indexAxis === 'y';

    return {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: chart.indexAxis,
        interaction: {
            mode: pointChart ? 'nearest' : 'index',
            intersect: false,
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label(context: { dataset: { label?: string }; raw: unknown; parsed: { x: number; y: number } }) {
                        const raw = context.raw as { label?: string; x?: number; y?: number };

                        if (raw?.label && pointChart) {
                            return `${raw.label}: ${chart.xColumn} ${raw.x}, ${chart.yColumn} ${raw.y}`;
                        }

                        return `${context.dataset.label ?? 'Value'}: ${horizontalBar ? context.parsed.x : context.parsed.y}`;
                    },
                },
            },
        },
        scales: {
            x: {
                beginAtZero: horizontalBar || pointChart,
                title: {
                    display: pointChart,
                    text: chart.xColumn,
                },
                ticks: {
                    maxRotation: pointChart || horizontalBar ? 0 : 35,
                    minRotation: pointChart || horizontalBar ? 0 : 35,
                },
                grid: {
                    display: pointChart,
                },
            },
            y: {
                beginAtZero: true,
                title: {
                    display: pointChart,
                    text: chart.yColumn,
                },
                grid: {
                    display: !horizontalBar,
                },
            },
            ...(chart.rightAxisColumns?.length
                ? {
                      y1: {
                          beginAtZero: true,
                          position: 'right',
                          grid: {
                              drawOnChartArea: false,
                          },
                      },
                  }
                : {}),
        },
    };
}

function ResultsChart({ result, rowLimit, emptyMessage }: ResultsChartProps): JSX.Element {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const hasChartData = result ? getChartRows(result, rowLimit) !== null : false;

    useEffect(() => {
        const canvas = canvasRef.current;
        const currentResult = result;
        const data = currentResult ? getChartRows(currentResult, rowLimit) : null;

        if (!canvas || !data || !currentResult) {
            return;
        }

        const instance = new Chart(canvas, {
            type: currentResult.query.chart.type,
            data: {
                labels: data.labels,
                datasets: styleDatasets(data.datasets, currentResult.query.chart),
            },
            options: buildOptions(currentResult.query.chart),
        } as never);

        return () => {
            instance.destroy();
        };
    }, [result, rowLimit]);

    return (
        <div className="h-[320px] overflow-hidden rounded-md border p-4">
            {hasChartData ? (
                <canvas ref={canvasRef} className="h-full w-full" />
            ) : (
                <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                    {emptyMessage}
                </div>
            )}
        </div>
    );
}

export { ResultsChart };
