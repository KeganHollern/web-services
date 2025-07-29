import { Header } from "@/components/page-header";
import { useLocation, useParams } from "react-router";

function GetContent() {
    const { id } = useParams();
    let { hash } = useLocation();

    if (hash === "") {
        return (
            <>TODO display failure case</>
        )
    }

    // strip # from hash
    hash = hash.slice(1)

    return (
        <>TODO send query to /api/secret/{id} and AES decrypt with key {hash}</>
    )
}

export function SecretViewerPage() {
    const breadcrumbs = [
        { label: "secret.lystic.dev" },
    ];

    // TODO: this entire thing will be reworked when api request is created

    return (
        // TODO: display optional "new" button in header
        <Header breadcrumbItems={breadcrumbs}>
            <div className="flex-1 flex justify-center items-center w-full">
                {GetContent()}
            </div>
        </Header>
    )
}

