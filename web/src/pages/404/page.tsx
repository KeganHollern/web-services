import { Header } from "@/components/page-header";
import YouAreLost from "@/assets/you-are-lost.gif";

export function PageNotFound() {
    const breadcrumbs = [
        { label: "lystic.dev", href: "https://lystic.dev" },
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