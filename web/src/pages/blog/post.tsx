import { Header } from "@/components/page-header";
import { MDXProvider } from "@mdx-js/react";
import { Loader } from "lucide-react";
import { Suspense } from "react";
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
                <div className="container mx-auto py-6 space-y-12">
                    <Suspense fallback={<div className="flex-1 flex justify-center items-center w-full"><Loader /></div>}>
                        <MDXProvider components={mdxComponents}>
                            {children}
                        </MDXProvider>
                    </Suspense>
                </div>
            </main>
        </>
    );
}