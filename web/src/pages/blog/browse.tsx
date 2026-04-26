import { Header } from "@/components/page-header";
import { PageMeta } from "@/components/page-meta";
import { Badge } from "@/components/ui/badge";
import { cn, webpSibling } from "@/lib/utils";
import { Link as Hyperlink } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { Modules } from "./posts";

const TAG_PARAM = "tag";

function useAvailableTags() {
    return useMemo(() => {
        const counts = new Map<string, number>();
        for (const { metadata } of Modules) {
            for (const tag of metadata.tags) {
                counts.set(tag, (counts.get(tag) ?? 0) + 1);
            }
        }
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([tag]) => tag);
    }, []);
}

export function BrowsePage() {
    const breadcrumbs = [
        { label: "lystic.dev/blog" },
    ];

    const [searchParams] = useSearchParams();
    const activeTag = searchParams.get(TAG_PARAM);
    const availableTags = useAvailableTags();

    const visiblePosts = useMemo(() => {
        if (!activeTag) return Modules;
        return Modules.filter(({ metadata }) => metadata.tags.includes(activeTag));
    }, [activeTag]);

    return (
        <>
            <PageMeta
                title="Lystic's Blog"
                description="Posts on game-cheat development, DMA hardware, low-level Windows internals, Ethereum, and other things Kegan has been building or breaking."
            />
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="container mx-auto py-6 space-y-6">
                    <h1 className="scroll-m-20 text-center mx-auto text-4xl max-w-3xl font-extrabold tracking-tight text-balance mb-12 border-b-2 pb-6">Lystic's Blog</h1>
                    {availableTags.length > 0 && (
                        <div className="mx-auto max-w-3xl flex flex-wrap gap-2">
                            <Badge asChild variant={activeTag ? "outline" : "default"}>
                                <Link to={{ pathname: "/", search: "" }}>all</Link>
                            </Badge>
                            {availableTags.map((tag) => {
                                const isActive = tag === activeTag;
                                return (
                                    <Badge key={tag} asChild variant={isActive ? "default" : "outline"}>
                                        <Link to={{ pathname: "/", search: isActive ? "" : `?${TAG_PARAM}=${encodeURIComponent(tag)}` }}>
                                            {tag}
                                        </Link>
                                    </Badge>
                                );
                            })}
                        </div>
                    )}
                    {visiblePosts.length === 0 ? (
                        <div className="mx-auto max-w-3xl text-center text-muted-foreground py-12">
                            <p>No posts tagged <span className="font-mono">{activeTag}</span>.</p>
                        </div>
                    ) : (
                        visiblePosts.map(({ metadata }, idx) => {

                            return (
                                <div
                                    key={metadata.slug}
                                    className={cn(
                                        "mx-auto max-w-3xl",
                                        idx > 0 ? "border-t-2 pt-6" : "",
                                    )}
                                >
                                    <Link
                                        to={{ pathname: `/${metadata.slug}` }}
                                        className={cn(
                                            "flex gap-4 items-stretch",
                                            "hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors",
                                            "max-sm:flex-col",
                                        )}
                                    >
                                        {metadata.image && (
                                            <picture>
                                                {webpSibling(metadata.image) && <source srcSet={webpSibling(metadata.image)!} type="image/webp" />}
                                                <img
                                                    src={metadata.image}
                                                    alt=""
                                                    className="w-40 sm:w-48 shrink-0 aspect-[16/9] object-cover rounded-md max-sm:w-full"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            </picture>
                                        )}
                                        <div className="flex flex-col justify-center min-w-0">
                                            <h3 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                                                {metadata.title} <Hyperlink className="h-3 w-3 shrink-0" />
                                            </h3>
                                            <p className="leading-6 mt-2 text-muted-foreground line-clamp-2">
                                                {metadata.description}
                                            </p>
                                            {metadata.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {metadata.tags.map((tag) => (
                                                        <Badge
                                                            key={tag}
                                                            variant={tag === activeTag ? "default" : "secondary"}
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            )
                        })
                    )}
                </div>
            </main>
        </>
    );
}
