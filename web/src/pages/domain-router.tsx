import "@/styles/globals.css"

import { HomeRouter } from "@/pages/home/router";
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


    // select which router we need to use based on which subdomain the user is on
    let PageRouter: React.FC
    const subdomain = getSubdomain();

    switch (subdomain) {
        case 'main':
            PageRouter = HomeRouter;
            break;
        default:
            PageRouter = HomeRouter; // TODO: 404 not found page
    }

    // return whichever router we need
    return (
        <PageRouter />
    )
}
