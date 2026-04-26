import { useLocation } from "react-router";

import { Header } from "@/components/page-header";
import { PageMeta } from "@/components/page-meta";

import { SharerPanel } from "./sharer";
import { ViewerPanel } from "./viewer";

export function SharePage() {
    const { hash } = useLocation();
    const isViewer = hash.length > 1;

    const breadcrumbs = [{ label: "lystic.dev/share" }];

    return (
        <>
            <PageMeta
                title={isViewer ? "View shared screen" : "Share your screen"}
                description="Peer-to-peer browser screen sharing over WebRTC. The signaling server only relays opaque frames — your stream stays end-to-end."
            />
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 flex justify-center items-center w-full p-4">
                    {isViewer ? <ViewerPanel key={hash} hash={hash} /> : <SharerPanel />}
                </div>
            </main>
        </>
    );
}
