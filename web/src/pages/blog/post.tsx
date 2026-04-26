import { Header } from "@/components/page-header";
import { PageMeta } from "@/components/page-meta";
import { Badge } from "@/components/ui/badge";
import { MDXProvider } from "@mdx-js/react";
import { ArrowLeft, Loader } from "lucide-react";
import { Suspense } from "react";
import { Link } from "react-router";
import { mdxComponents } from './components';


type BlogPostProps = {
    children?: React.ReactNode
    title: string
    description?: string
    image?: string
    date?: string
    tags?: string[]
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
});

function formatPublishDate(date: string): string | null {
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return null;
    return dateFormatter.format(new Date(Date.UTC(y, m - 1, d)));
}

export function Post({ children, title, description, image, date, tags }: BlogPostProps) {
    const breadcrumbs = [
        { label: "lystic.dev/blog", href: "/" },
        { label: title }
    ];
    const formattedDate = date ? formatPublishDate(date) : null;

    return (
        <>
            <PageMeta
                title={title}
                description={description}
                image={image}
                type="article"
            />
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="container mx-auto py-6 space-y-6">
                    <Suspense fallback={<div className="flex-1 flex justify-center items-center w-full"><Loader /></div>}>
                        {image && (
                            <div className="mx-auto max-w-3xl px-6">
                                <img
                                    src={image}
                                    alt=""
                                    className="w-full aspect-[16/9] object-cover rounded-lg"
                                    loading="eager"
                                    decoding="async"
                                />
                            </div>
                        )}
                        <MDXProvider components={mdxComponents}>
                            <div className="mx-auto max-w-3xl">
                                <div className="p-6">
                                    {(formattedDate || (tags && tags.length > 0)) && (
                                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4 text-sm text-muted-foreground">
                                            {formattedDate && <span>{formattedDate}</span>}
                                            {tags && tags.length > 0 && (
                                                <div className="flex flex-wrap items-center justify-end gap-2">
                                                    {tags.map((tag) => (
                                                        <Badge key={tag} variant="secondary">{tag}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {children}
                                </div>
                            </div>
                        </MDXProvider>
                        <div className="mx-auto max-w-4xl">
                            {/* TODO: _next_ button for navigating to next post ? */}
                            <Link to={'..'} className="pt-6 flex items-center gap-2"><ArrowLeft /> BACK</Link>
                        </div>
                    </Suspense>
                </div>
            </main>
        </>
    );
}