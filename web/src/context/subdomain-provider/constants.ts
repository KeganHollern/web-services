import type { ReactNode } from "react";

export interface SubdomainContextType {
    subdomain: string;
    setSubdomain: (subdomain: string) => void;
}

export type SubdomainProviderProps = {
    children: ReactNode;
}
