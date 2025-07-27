import { Header } from "@/components/page-header";
import YouAreLost from "@/assets/you-are-lost.gif";

type PageNotFoundProps = {
    domain?: string
}

export function PageNotFound({ domain }: PageNotFoundProps) {
    if (domain === undefined) {
        domain = "lystic.dev"
    }

    const breadcrumbs = [
        { label: domain, href: `https://${domain}` },
        { label: "404" }
    ];

    return (
        <Header breadcrumbItems={breadcrumbs}>
            <div className="flex-1 flex justify-center items-center w-full">
                <img
                    src={YouAreLost}
                    alt="Page Not Found"
                    className="max-w-full max-h-full"
                />
            </div>
        </Header>
    );
}