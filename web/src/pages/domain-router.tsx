
import { SubdomainProvider, useSubdomain } from "@/context/subdomain-provider"; // Adjust import path

import { HomeRouter } from "@/pages/home/router";
import { BlogRouter } from "@/pages/blog/router";

import { PageNotFound } from "@/pages/404/page";
import Cookies from "js-cookie";

export function DomainRouter() {
    const getSubdomain = () => {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        // Assuming base domain is 'lystic.dev' (2 parts), subdomain is parts[0] if length > 2
        if (parts.length > 2) {
            return parts[0].toLowerCase();
        }

        return 'main'; // Or '' for the root domain
    };

    if (process.env.NODE_ENV === "development") {
        // in dev mode, we have a provider that will allow us to switch subdomains implicitly
        // we also store the selected subdomain in a cookie, so we can retain it between reloads
        return (
            <SubdomainProvider initialSubdomain={Cookies.get("dev_subdomain") ?? getSubdomain()}>
                <DomainRouterInner />
            </SubdomainProvider>
        )
    } else {
        // Prod: No provider, just use detected subdomain
        let PageRouter: React.FC = GetPageRouter(getSubdomain());
        return <PageRouter />;
    }
}

// Inner component for dev mode to access context
function DomainRouterInner() {
    const { subdomain } = useSubdomain();
    let PageRouter: React.FC = GetPageRouter(subdomain);
    return <PageRouter />;
}

function GetPageRouter(subdomain: string): React.FC {
    switch (subdomain) {
        case "main":
            return HomeRouter;
        case "blog":
            return BlogRouter;

        default:
            return PageNotFound;
    }
}

