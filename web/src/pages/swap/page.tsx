import { Header } from "@/components/page-header";

export function SwapPage() {
    const breadcrumbs = [
        { label: "swap.lystic.dev" },
    ];
    return (
        <Header breadcrumbItems={breadcrumbs}>
            <div className="flex-1 flex justify-center items-center w-full">
                SWAP IS TODO
            </div>
        </Header>
    );
}