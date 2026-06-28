
import { SubdomainProvider, useSubdomain } from "@/context/subdomain-provider"; // Adjust import path

import { BlogRouter } from "@/pages/blog/router";
import { EditRouter } from "@/pages/edit/router";
import { FifaRouter } from "@/pages/fifa";
import { HomeRouter } from "@/pages/home/router";
import { PingRouter } from "@/pages/ping";
import { SecretRouter } from "@/pages/secret/router";
import { ShareRouter } from "@/pages/share/router";
import { SwapRouter } from "@/pages/swap/router";
import { PageNotFound } from "@/pages/404/page";

// Single source of truth: subdomain/path-segment -> router. Consumed by
// domain resolution (lib/domain.ts) and by the dev subdomain selector.
// "main" is handled separately as the root/home router.
export const SERVICE_ROUTERS: Record<string, React.FC> = {
    blog: BlogRouter,
    secret: SecretRouter,
    edit: EditRouter,
    swap: SwapRouter,
    share: ShareRouter,
    ping: PingRouter,
    fifa: FifaRouter,
};

function GetPageRouter(subdomain: string): React.FC {
    if (subdomain === "main") return HomeRouter;
    return SERVICE_ROUTERS[subdomain] ?? PageNotFound;
}


function DomainRouterInner() {
    const { subdomain } = useSubdomain();
    const PageRouter: React.FC = GetPageRouter(subdomain);
    return <PageRouter />;
}

export function DomainRouter() {
    return (
        <SubdomainProvider>
            <DomainRouterInner />
        </SubdomainProvider>
    )
}
