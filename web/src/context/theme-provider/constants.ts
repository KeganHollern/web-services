export type Theme = "dark" | "light" | "system";

export const LightTheme: Theme = "light";
export const DarkTheme: Theme = "dark";
export const SystemTheme: Theme = "system";

export type ThemeNameEntry = {
    theme: Theme;
    name: string;
};

export const ThemeNames: ThemeNameEntry[] = [
    { theme: LightTheme, name: "Light" },
    { theme: DarkTheme, name: "Dark" },
    { theme: SystemTheme, name: "System" },
];

export type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

export type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};