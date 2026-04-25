import { Header } from "@/components/page-header";
import { PageMeta } from "@/components/page-meta";
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
}

export function Post({ children, title, description, image }: BlogPostProps) {
    const breadcrumbs = [
        { label: "blog.lystic.dev", href: "/" },
        { label: title }
    ];

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
                                <div className="p-6">{children}</div>
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