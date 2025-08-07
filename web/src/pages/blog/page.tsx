import { Header } from "@/components/page-header";

export function BlogPage() {
    const breadcrumbs = [
        { label: "blog.lystic.dev" },
    ];

    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 flex justify-center items-center w-full">
                    BLOG IS TODO
                </div>
            </main>
        </>
    );
}