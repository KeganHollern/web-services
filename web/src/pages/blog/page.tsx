import { Header } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { Link as Hyperlink } from "lucide-react";
import { Link } from "react-router";
import { Modules } from "./posts";

export function BlogPage() {
    const breadcrumbs = [
        { label: "blog.lystic.dev" },
    ];

    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="container mx-auto py-6 space-y-6">
                    <h1 className="scroll-m-20 text-center mx-auto text-4xl max-w-3xl font-extrabold tracking-tight text-balance mb-12 border-b-2 pb-6">Lystic's Blog</h1>
                    {
                        Modules.map(({ metadata }, idx) => {

                            return (
                                <div className={cn("mx-auto max-w-3xl", idx > 0 ? "border-t-2 pt-6" : "")} key={metadata.slug}>
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