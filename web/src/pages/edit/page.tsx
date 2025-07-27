import { Header } from "@/components/page-header";

export function EditPage() {
    const breadcrumbs = [
        { label: "edit.lystic.dev" },
    ];
    return (
        <Header breadcrumbItems={breadcrumbs}>
            <div className="flex-1 flex justify-center items-center w-full">
                EDITOR IS TODO
            </div>
        </Header>
    );
}