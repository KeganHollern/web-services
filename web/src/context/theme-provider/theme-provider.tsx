import useSharedState from "@/hooks/use-sharedstate";
import { useEffect } from "react";
import { SystemTheme, type ThemeProviderProps } from "./constants";
import { ThemeProviderContext } from "./useTheme";

export default function ThemeProvider({
    children,
    defaultTheme = SystemTheme,
    storageKey = "theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useSharedState(storageKey, defaultTheme);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        const effectiveTheme = theme === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
            : theme;
        root.classList.add(effectiveTheme);
    }, [theme]);

    return (
        <ThemeProviderContext.Provider {...props} value={{ theme, setTheme }}>
            {children}
        </ThemeProviderContext.Provider>
    );
}