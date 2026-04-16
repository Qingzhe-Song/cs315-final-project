declare module 'tabulator-tables' {
    export class TabulatorFull {
        constructor(element: HTMLElement, options?: Record<string, unknown>);
        destroy(): void;
        download(type: string, fileName: string): void;
    }
}
