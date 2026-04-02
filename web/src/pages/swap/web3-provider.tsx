import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme, lightTheme, type Theme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/wagmi";
import { useTheme } from "@/context/theme-provider";
import { useMemo } from "react";

const queryClient = new QueryClient();

function useRainbowKitTheme(): Theme {
    const { theme } = useTheme();

    return useMemo(() => {
        const isDark = theme === "dark" ||
            (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

        const base = isDark
            ? darkTheme({ borderRadius: "medium", fontStack: "system" })
            : lightTheme({ borderRadius: "medium", fontStack: "system" });

        if (isDark) {
            base.colors.accentColor = "hsl(30 3% 15%)";
            base.colors.accentColorForeground = "hsl(55 10% 79%)";
            base.colors.modalBackground = "hsl(0 3% 6%)";
            base.colors.modalBorder = "hsl(40 3% 20%)";
            base.colors.profileForeground = "hsl(0 3% 6%)";
            base.colors.closeButtonBackground = "hsl(30 3% 15%)";
            base.colors.connectButtonBackground = "hsl(30 3% 15%)";
            base.colors.connectButtonInnerBackground = "hsl(30 4% 11%)";
            base.colors.connectButtonText = "hsl(55 10% 79%)";
            base.colors.actionButtonBorder = "hsl(40 3% 20%)";
            base.colors.actionButtonSecondaryBackground = "hsl(30 3% 15%)";
            base.colors.generalBorder = "hsl(40 3% 20%)";
            base.colors.generalBorderDim = "hsl(30 3% 24%)";
            base.colors.menuItemBackground = "hsl(30 4% 11%)";
            base.colors.modalTextSecondary = "hsl(43 3% 52%)";
            base.colors.modalText = "hsl(55 10% 79%)";
            base.colors.selectedOptionBorder = "hsl(30 3% 24%)";
            base.colors.standby = "hsl(43 3% 52%)";
            base.fonts.body = '"Google Sans Code", monospace';
        } else {
            base.colors.accentColor = "hsl(51 21% 88%)";
            base.colors.accentColorForeground = "hsl(0 3% 6%)";
            base.colors.modalBackground = "hsl(48 100% 97%)";
            base.colors.modalBorder = "hsl(50 14% 83%)";
            base.colors.profileForeground = "hsl(48 100% 97%)";
            base.colors.closeButtonBackground = "hsl(51 21% 88%)";
            base.colors.connectButtonBackground = "hsl(48 100% 97%)";
            base.colors.connectButtonInnerBackground = "hsl(51 33% 92%)";
            base.colors.connectButtonText = "hsl(0 3% 6%)";
            base.colors.actionButtonBorder = "hsl(50 14% 83%)";
            base.colors.actionButtonSecondaryBackground = "hsl(51 21% 88%)";
            base.colors.generalBorder = "hsl(50 14% 83%)";
            base.colors.generalBorderDim = "hsl(55 10% 79%)";
            base.colors.menuItemBackground = "hsl(51 33% 92%)";
            base.colors.modalTextSecondary = "hsl(50 3% 42%)";
            base.colors.modalText = "hsl(0 3% 6%)";
            base.colors.selectedOptionBorder = "hsl(55 10% 79%)";
            base.colors.standby = "hsl(50 3% 42%)";
            base.fonts.body = '"Google Sans Code", monospace';
        }

        return base;
    }, [theme]);
}

export function SwapWeb3Provider({ children }: { children: React.ReactNode }) {
    const rainbowTheme = useRainbowKitTheme();

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={rainbowTheme}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
