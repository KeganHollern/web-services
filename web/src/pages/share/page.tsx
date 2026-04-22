import { useLocation } from "react-router";

import { Header } from "@/components/page-header";

import { SharerPanel } from "./sharer";
import { ViewerPanel } from "./viewer";

export function SharePage() {
    const { hash } = useLocation();
    const isViewer = hash.length > 1;

    const breadcrumbs = [{ label: "share.lystic.dev" }];

    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 flex justify-center items-center w-full p-4">
                    {isViewer ? <ViewerPanel hash={hash} /> : <SharerPanel />}
                </div>
            </main>
        </>
    );
}
