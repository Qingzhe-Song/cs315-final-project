import Chart from 'chart.js/auto';
import { useEffect, useRef } from 'react';
import type { JSX } from 'react';

import { getChartRows } from '@/lib/query-results';
import type { QueryResult } from '@/types';

interface ResultsChartProps {
    result: QueryResult | null;
    emptyMessage: string;
}

function ResultsChart({ result, emptyMessage }: ResultsChartProps): JSX.Element {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const hasChartData = result ? getChartRows(result) !== null : false;

    useEffect(() => {
        const canvas = canvasRef.current;
        const data = result ? getChartRows(result) : null;

        if (!canvas || !data) {
            return;
        }

        const instance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 35,
                            minRotation: 35,
                        },
                        grid: {
                            display: false,
                        },
                    },
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });

        return () => {
            instance.destroy();
        };
    }, [result]);

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
