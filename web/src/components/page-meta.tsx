import { useLocation } from "react-router";

export const SITE_NAME = "lystic.dev";
export const SITE_DEFAULT_DESCRIPTION =
    "Lystic's platform — privacy-respecting tools for sharing files, secrets, screens, and more.";
export const SITE_DEFAULT_OG_IMAGE = "/og-image.png";

type PageMetaProps = {
    title: string;
    description?: string;
    image?: string;
    type?: "website" | "article";
};

// Renders SEO + Open Graph + Twitter Card metadata. Relies on React 19's
// built-in document metadata hoisting to move these into <head>.
export function PageMeta({
    title,
    description = SITE_DEFAULT_DESCRIPTION,
    image,
    type = "website",
}: PageMetaProps) {
    const location = useLocation();

    const fullTitle = title === SITE_NAME || title.endsWith(`| ${SITE_NAME}`)
        ? title
        : `${title} | ${SITE_NAME}`;

    // Social crawlers don't resolve relative URLs, so build absolute ones.
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = origin ? `${origin}${location.pathname}` : "";
    const resolvedImage = image
        ? image.startsWith("http")
            ? image
            : `${origin}${image}`
        : `${origin}${SITE_DEFAULT_OG_IMAGE}`;

    return (
        <>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {url && <link rel="canonical" href={url} />}

            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={type} />
            {url && <meta property="og:url" content={url} />}
            {origin && <meta property="og:image" content={resolvedImage} />}

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            {origin && <meta name="twitter:image" content={resolvedImage} />}
        </>
    );
}
