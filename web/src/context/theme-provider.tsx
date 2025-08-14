
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

export const LightTheme: Theme = "light"
export const DarkTheme: Theme = "dark"
export const SystemTheme: Theme = "system"

// all themes mapped to human readible name
type ThemeNameEntry = {
    theme: Theme
    name: string
}
export const ThemeNames: ThemeNameEntry[] = [
    { theme: LightTheme, name: "Light" },
    { theme: DarkTheme, name: "Dark" },
    { theme: SystemTheme, name: "System" },
];


type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: SystemTheme,
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)


export function ThemeProvider({
    children,
    defaultTheme = SystemTheme,
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === SystemTheme) {
            // TODO: make this a util to map system theme to light or dark
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}