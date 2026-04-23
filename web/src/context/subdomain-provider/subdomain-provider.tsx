import { resolveDomain } from "@/lib/domain";
import useSharedState from "@/hooks/use-sharedstate";
import type { SubdomainProviderProps } from "./constants";
import { SubdomainContext } from "./useSubdomain";

// Provider component
export default function SubdomainProvider({ children }: SubdomainProviderProps) {
    const resolved = resolveDomain();

    let [subdomain, setSubdomain] = useSharedState('dev_subdomain', resolved.subdomain);

    // Lock the subdomain to what the URL says when:
    //   - we're in production, OR
    //   - the URL itself specifies a service (via hostname or /<service> path prefix).
    // The dev-selector override only applies at the bare root (e.g. localhost:5173/).
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev || resolved.fromUrl) {
        subdomain = resolved.subdomain;
        setSubdomain = () => { console.warn("setSubdomain is disabled when the URL already specifies a service"); };
    }

    return (
        <SubdomainContext.Provider value={{ subdomain, setSubdomain }}>
            {children}
        </SubdomainContext.Provider>
    );
}
