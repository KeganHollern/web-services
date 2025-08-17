import { Header } from "@/components/page-header";
import { Link } from "react-router";
import { Modules } from "./posts";

export function BlogPage() {
    const breadcrumbs = [
        { label: "blog.lystic.dev" },
    ];


    const posts = Object.entries(Modules).map(([filePath]) => {
        const slug = filePath.split("/").pop()?.replace(".mdx", "") ?? "";
        const title = slug.replaceAll("-", " ");

        return [slug, title]
    })

    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 flex justify-center items-center w-full">
                    {
                        posts.map(([slug, title]) => {
                            return (
                                <p>
                                    <Link to={{ pathname: `/${slug}` }}>
                                        {title}
                                    </Link>
                                </p>
                            )
                        })
                    }
                </div>
            </main>
        </>
    );
}