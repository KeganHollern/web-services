import { Header } from "@/components/page-header";
import { PageMeta } from "@/components/page-meta";
import { cn } from "@/lib/utils";
import { Link as Hyperlink } from "lucide-react";
import { Link } from "react-router";
import { Modules } from "./posts";

export function BrowsePage() {
    const breadcrumbs = [
        { label: "blog.lystic.dev" },
    ];

    // TODO: post tags, order by date, etc

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
                    {
                        Modules.map(({ metadata }, idx) => {

                            return (
                                <Link
                                    to={{ pathname: `/${metadata.slug}` }}
                                    key={metadata.slug}
                                    className={cn(
                                        "mx-auto max-w-3xl flex gap-4 items-stretch",
                                        "hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors",
                                        "max-sm:flex-col",
                                        idx > 0 ? "border-t-2 pt-6 mt-2 rounded-none" : "",
                                    )}
                                >
                                    {metadata.image && (
                                        <img
                                            src={metadata.image}
                                            alt=""
                                            className="w-40 sm:w-48 shrink-0 aspect-[16/9] object-cover rounded-md max-sm:w-full"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    )}
                                    <div className="flex flex-col justify-center min-w-0">
                                        <h3 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                                            {metadata.title} <Hyperlink className="h-3 w-3 shrink-0" />
                                        </h3>
                                        <p className="leading-6 mt-2 text-muted-foreground line-clamp-2">
                                            {metadata.description}
                                        </p>
                                    </div>
                                </Link>
                            )
                        })
                    }
                </div>
            </main>
        </>
    );
}