// local declaration for the tabulator package methods used by the app.
declare module 'tabulator-tables' {
    export class TabulatorFull {
        // creates a table inside the provided element using tabulator options.
        constructor(element: HTMLElement, options?: Record<string, unknown>);
        // removes tabulator markup and listeners during react cleanup.
        destroy(): void;
        // exposes tabulator's download api for future table export work.
        download(type: string, fileName: string): void;
    }
}
