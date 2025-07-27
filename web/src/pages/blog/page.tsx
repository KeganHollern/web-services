import { Header } from "@/components/page-header";

export function BlogPage() {
    const breadcrumbs = [
        { label: "blog.lystic.dev", href: "https://blog.lystic.dev" },
    ];
    return (
        <Header breadcrumbItems={breadcrumbs}>
            <div className="flex-1 flex justify-center items-center w-full">
                BLOG IS TODO
            </div>
        </Header>
    );
}