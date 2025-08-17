import { Header } from "@/components/page-header";
import { MDXProvider } from "@mdx-js/react";

import { mdxComponents } from './components';

import Post from './posts/typeography.mdx';
// import Post from './posts/is-your-unique-dma-firmware-actually-unique.mdx';

export function BlogPost() {
    const breadcrumbs = [
        { label: "blog.lystic.dev", href: "/" },
        { label: "todo-post" }
    ];

    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="container mx-auto py-6 space-y-12">
                    <MDXProvider components={mdxComponents}>
                        <Post />
                    </MDXProvider>
                </div>
            </main>
        </>
    );
}