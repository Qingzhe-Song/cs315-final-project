export function mustQuery<T extends Element>(selector: string): T {
    const node = document.querySelector<T>(selector);
    if (!node) throw new Error(`Missing required node: ${selector}`);
    return node;
}

export function formParams(form: HTMLFormElement): Record<string, string> {
    return Object.fromEntries(
        Array.from(new FormData(form).entries(), ([key, value]) => [key, String(value)])
    );
}
