import { Header } from "@/components/page-header";

export function SecretPage() {
    const breadcrumbs = [
        { label: "secret.lystic.dev" },
    ];
    return (
        <Header breadcrumbItems={breadcrumbs}>
            <div className="flex-1 flex justify-center items-center w-full">
                SECRETS IS TODO
            </div>
        </Header>
    );
}