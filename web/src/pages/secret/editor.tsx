import { Header } from "@/components/page-header";

export function SecretEditorPage() {
    const breadcrumbs = [
        { label: "secret.lystic.dev" },
    ];
    return (
        // TODO: header needs optional button(s) i can define
        <Header breadcrumbItems={breadcrumbs}>
            <div className="flex-1 flex justify-center items-center w-full">
                SECRET EDITOR IS TODO
            </div>
        </Header>
    );
}