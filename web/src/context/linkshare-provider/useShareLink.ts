import { createContext, useContext } from "react";
import type { LinkShareContextType } from "./constants";

export const LinkShareContext = createContext<LinkShareContextType | undefined>(undefined);

export function useLinkShare(): LinkShareContextType {
    const context = useContext(LinkShareContext);
    if (!context) {
        throw new Error("useLinkShare must be used within a LinkShareProvider");
    }
    return context;
}