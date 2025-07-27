import { createContext, useContext, useState, type ReactNode } from "react";
import Cookies from 'js-cookie';

// Context type
interface SubdomainContextType {
    subdomain: string;
    setSubdomain: (subdomain: string) => void;
}

const SubdomainContext = createContext<SubdomainContextType | undefined>(undefined);

// Provider component
export function SubdomainProvider({ children, initialSubdomain }: { children: ReactNode; initialSubdomain: string }) {
    const [subdomain, setSubdomainState] = useState(initialSubdomain);

    // Custom function to update state and set cookie
    const setSubdomain = (newSubdomain: string) => {
        setSubdomainState(newSubdomain);
        Cookies.set('dev_subdomain', newSubdomain, { expires: 7 }); // Set cookie with 7-day expiry
    };

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