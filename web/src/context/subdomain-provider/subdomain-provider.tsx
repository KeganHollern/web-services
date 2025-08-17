import useSharedState from "@/hooks/use-sharedstate";
import type { SubdomainProviderProps } from "./constants";
import { SubdomainContext } from "./useSubdomain";

// Provider component
export default function SubdomainProvider({ children }: SubdomainProviderProps) {
    const getSubdomain = () => {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        // Assuming base domain is 'lystic.dev' (2 parts), subdomain is parts[0] if length > 2
        if (parts.length > 2) {
            return parts[0].toLowerCase();
        }

        return 'main'; // Or '' for the root domain
    };

    let [subdomain, setSubdomain] = useSharedState('dev_subdomain', getSubdomain());

    // if not development then we'll force this provider to give out the current
    // subdomain value and be unmodifyable
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev) {
        subdomain = getSubdomain();
        setSubdomain = () => { console.warn("should not be able to call setsubdomain in prod! "); }
    }

    return (
        <SubdomainContext.Provider value={{ subdomain, setSubdomain }}>
            {children}
        </SubdomainContext.Provider>
    );
}
