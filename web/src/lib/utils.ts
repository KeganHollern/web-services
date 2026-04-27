import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Widths must match WEBP_VARIANT_WIDTHS in vite.config.ts.
const WEBP_VARIANT_WIDTHS = [384, 768, 1280] as const

export interface WebpVariants {
    srcSet: string
    src: string
}

// Map a PNG/JPEG URL to the build-emitted responsive .webp variants. Returns
// a srcset spanning the configured widths and a default fallback URL pointing
// at the largest variant. Returns null when the source isn't a raster format
// the build pipeline fans out to webp.
export function webpVariants(src: string | undefined): WebpVariants | null {
    if (!src) return null
    const match = src.match(/^(.*)\.(?:png|jpe?g)(\?.*)?$/i)
    if (!match) return null
    const [, base, query = ""] = match
    const srcSet = WEBP_VARIANT_WIDTHS.map((w) => `${base}-${w}.webp${query} ${w}w`).join(", ")
    const fallbackWidth = WEBP_VARIANT_WIDTHS[WEBP_VARIANT_WIDTHS.length - 1]
    const fallback = `${base}-${fallbackWidth}.webp${query}`
    return { srcSet, src: fallback }
}
