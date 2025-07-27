import { createContext, useContext, useState, type ReactNode } from "react";

// Context type
interface SubdomainContextType {
    subdomain: string;
    setSubdomain: (subdomain: string) => void;
}

const SubdomainContext = createContext<SubdomainContextType | undefined>(undefined);

// Provider component
export function SubdomainProvider({ children, initialSubdomain }: { children: ReactNode; initialSubdomain: string }) {
    const [subdomain, setSubdomain] = useState(initialSubdomain);
    return (
        <SubdomainContext.Provider value={{ subdomain, setSubdomain }}>
            {children}
        </SubdomainContext.Provider>
    );
}

// Hook for easy access
export function useSubdomain() {
    const context = useContext(SubdomainContext);
    if (context === undefined) {
        throw new Error("useSubdomain must be used within a SubdomainProvider");
    }
    return context;
}