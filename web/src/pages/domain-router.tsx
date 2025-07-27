
import { SubdomainProvider, useSubdomain } from "@/context/subdomain-provider"; // Adjust import path
import { HomeRouter } from "@/pages/home/router";
import { PageNotFound } from "@/pages/404/page";
// TODO: routers for other subdomain

export function DomainRouter() {
    // TODO: detect subdomain to route
    // Function to detect subdomain
    const getSubdomain = () => {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        // Assuming base domain is 'lystic.dev' (2 parts), subdomain is parts[0] if length > 2
        if (parts.length > 2) {
            return parts[0].toLowerCase();
        }

        return 'main'; // Or '' for the root domain
    };

    const isDev = process.env.NODE_ENV === "development";
    const initialSubdomain = getSubdomain();

    if (isDev) {
        // In dev, we'll use the context value, but defer the switch until inside the provider
        return (
            <SubdomainProvider initialSubdomain={initialSubdomain}>
                <DomainRouterInner />
            </SubdomainProvider>
        )
    } else {
        // Prod: No provider, just use detected subdomain
        let PageRouter: React.FC = GetPageRouter(initialSubdomain);
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
        // TODO: Add cases as you implement more subdomains
        default:
            return PageNotFound;
    }
}

