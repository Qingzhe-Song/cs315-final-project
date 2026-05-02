import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// merges conditional class names and resolves conflicting tailwind utilities.
function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

export { cn };
