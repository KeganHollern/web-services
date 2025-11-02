import { Header } from "@/components/page-header";

export function UploadPage() {
    const breadcrumbs = [
        { label: "upload.lystic.dev" },
    ];
    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 flex justify-center items-center w-full">
                    UPLOAD IS TODO
                </div>
            </main>
        </>
    );
}