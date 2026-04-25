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
                                <div className={cn("mx-auto max-w-3xl", idx > 0 ? "border-t-2 pt-6" : "")} key={metadata.slug}>
                                    {metadata.image && (
                                        <Link to={{ pathname: `/${metadata.slug}` }} className="block mb-4">
                                            <img
                                                src={metadata.image}
                                                alt=""
                                                className="w-full aspect-[16/9] object-cover rounded-lg"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </Link>
                                    )}
                                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                                        <Link to={{ pathname: `/${metadata.slug}` }} className="flex items-center gap-2">
                                            {metadata.title} <Hyperlink className="h-3 w-3" />
                                        </Link>
                                    </h3>
                                    <p className="leading-7 [&:not(:first-child)]:mt-6 text-muted-foreground">
                                        {metadata.description}
                                    </p>
                                </div>
                            )
                        })
                    }
                </div>
            </main>
        </>
    );
}