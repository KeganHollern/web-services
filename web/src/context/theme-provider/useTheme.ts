import { createContext, useContext } from "react";
import { SystemTheme, type ThemeProviderState } from "./constants";


export const ThemeProviderContext = createContext<ThemeProviderState>({
    theme: SystemTheme,
    setTheme: () => null,
});

export function useTheme(): ThemeProviderState {
    const context = useContext(ThemeProviderContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};