import YouAreLost from "@/assets/you-are-lost.gif";
import { Header } from "@/components/page-header";

type PageNotFoundProps = {
    domain?: string
}

export function PageNotFound({ domain }: PageNotFoundProps) {
    if (domain === undefined) {
        domain = "lystic.dev"
    }

    const breadcrumbs = [
        { label: domain, href: `/` },
        { label: "404" }
    ];

    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 flex justify-center items-center w-full">
                    <img
                        src={YouAreLost}
                        alt="Page Not Found"
                        className="max-w-full max-h-full"
                    />
                </div>
            </main>
        </>
    );
}