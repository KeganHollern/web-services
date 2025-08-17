
import { SubdomainProvider, useSubdomain } from "@/context/subdomain-provider"; // Adjust import path

import { BlogRouter } from "@/pages/blog/router";
import { EditRouter } from "@/pages/edit/router";
import { HomeRouter } from "@/pages/home/router";
import { SecretRouter } from "@/pages/secret/router";
import { SwapRouter } from "@/pages/swap/router";

import { PageNotFound } from "@/pages/404/page";


function GetPageRouter(subdomain: string): React.FC {
    switch (subdomain) {
        case "main":
            return HomeRouter;
        case "blog":
            return BlogRouter;
        case "secret":
            return SecretRouter;
        case "edit":
            return EditRouter;
        case "swap":
            return SwapRouter;

        default:
            return PageNotFound;
    }
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


