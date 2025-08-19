import { Header } from "@/components/page-header";
import { MDXProvider } from "@mdx-js/react";
import { ArrowLeft, Loader } from "lucide-react";
import { Suspense } from "react";
import { Link } from "react-router";
import { mdxComponents } from './components';


type BlogPostProps = {
    children?: React.ReactNode
    title: string
}

export function Post({ children, title }: BlogPostProps) {
    const breadcrumbs = [
        { label: "blog.lystic.dev", href: "/" },
        { label: title }
    ];

    // TODO: inject SEO metadata like title, and description, for
    // discord and search engines to utilize

    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="container mx-auto py-6 space-y-6">
                    <Suspense fallback={<div className="flex-1 flex justify-center items-center w-full"><Loader /></div>}>
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