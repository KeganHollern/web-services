// Utility functions for cross-subdomain storage with localStorage backup
export function getRootDomain() {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    // For domains like 'sub.example.com', return 'example.com'
    // For 'localhost' or simple domains, return as-is
    if (parts.length > 2) {
        return parts.slice(-2).join('.');
    }
    return hostname;
}

export function setCookie(key: string, value: string) {
    const encodedValue = encodeURIComponent(value);
    const rootDomain = getRootDomain();
    const domainAttr = rootDomain !== 'localhost' ? `domain=.${rootDomain}` : '';
    document.cookie = `${key}=${encodedValue}; path=/; ${domainAttr}; max-age=31536000; secure; samesite=lax`;
}

export function getCookie(key: string): string | null {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
        const [cookieKey, cookieValue] = cookie.split('=');
        if (cookieKey === key) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null;
}

export function setItem(key: string, value: string) {
    // Store in localStorage (per subdomain backup)
    localStorage.setItem(key, value);
    // Store in cookie (shared across subdomains)
    setCookie(key, value);
}

export function getItem(key: string): string | null {
    // First, try cookie (shared)
    let value = getCookie(key);
    if (value !== null) {
        // Sync to localStorage for future backup
        localStorage.setItem(key, value);
        return value;
    }
    // If cookie missing/expired, recover from localStorage and re-set cookie
    value = localStorage.getItem(key);
    if (value !== null) {
        setCookie(key, value);
        return value;
    }
    return null;
}
