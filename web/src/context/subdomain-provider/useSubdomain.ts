import { createContext, useContext } from "react";
import type { SubdomainContextType } from "./constants";

export const SubdomainContext = createContext<SubdomainContextType | undefined>(undefined);

export function useSubdomain(): SubdomainContextType {
    const context = useContext(SubdomainContext);
    if (context === undefined) {
        throw new Error("useSubdomain must be used within a SubdomainProvider");
    }
    return context;
}