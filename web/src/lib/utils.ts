import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Map a PNG/JPEG URL to its build-emitted .webp sibling. Returns null when the
// source isn't a raster format the build pipeline fans out to webp.
export function webpSibling(src: string | undefined): string | null {
    if (!src) return null
    const swapped = src.replace(/\.(png|jpe?g)(\?.*)?$/i, (_, _ext, query) => `.webp${query ?? ""}`)
    return swapped === src ? null : swapped
}
