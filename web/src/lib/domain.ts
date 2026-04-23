import { SERVICE_ROUTERS } from "@/pages/domain-router";

export type ResolvedDomain = {
    subdomain: string;
    basename: string;
    fromUrl: boolean;
};

export function resolveDomain(): ResolvedDomain {
    if (typeof window === "undefined") {
        return { subdomain: "main", basename: "/", fromUrl: false };
    }

    const parts = window.location.hostname.split(".");
    if (parts.length > 2) {
        return { subdomain: parts[0].toLowerCase(), basename: "/", fromUrl: true };
    }

    const first = window.location.pathname.split("/").filter(Boolean)[0]?.toLowerCase();
    if (first && first in SERVICE_ROUTERS) {
        return { subdomain: first, basename: `/${first}`, fromUrl: true };
    }

    return { subdomain: "main", basename: "/", fromUrl: false };
}

// Build an absolute URL for a path within the current service, honoring the
// basename so shared links work in both subdomain mode (basename "/") and
// path-prefix mode (basename "/edit", "/secret", etc).
export function serviceUrl(path: string): string {
    const { basename } = resolveDomain();
    const base = basename === "/" ? "" : basename;
    const suffix = path.startsWith("/") ? path : `/${path}`;
    return `${window.location.origin}${base}${suffix}`;
}
