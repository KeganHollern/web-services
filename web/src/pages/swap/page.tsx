import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowDownIcon } from "lucide-react";
import { Header } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { TokenSelectorModal, type Token } from "./token-selector-modal";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tab navigation
// ---------------------------------------------------------------------------

type Tab = "swap" | "lend";

const TABS: { id: Tab; label: string }[] = [
    { id: "swap", label: "Swap" },
    { id: "lend", label: "Lend" },
];

// ---------------------------------------------------------------------------
// Swap tab
// ---------------------------------------------------------------------------

type ModalTarget = "from" | "to";

function SwapTab() {
    const [fromToken, setFromToken] = useState<Token | null>(null);
    const [toToken, setToToken] = useState<Token | null>(null);
    const [fromAmount, setFromAmount] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTarget, setModalTarget] = useState<ModalTarget>("from");

    function openModal(target: ModalTarget) {
        setModalTarget(target);
        setModalOpen(true);
    }

    function handleTokenSelect(token: Token) {
        if (modalTarget === "from") {
            setFromToken(token);
            if (toToken?.address === token.address) setToToken(null);
        } else {
            setToToken(token);
            if (fromToken?.address === token.address) setFromToken(null);
        }
    }

    function swapDirection() {
        setFromToken(toToken);
        setToToken(fromToken);
        setFromAmount("");
    }

    return (
        <>
            <div className="w-full max-w-sm mx-auto mt-8 rounded-xl border bg-background shadow-sm p-4 flex flex-col gap-3">
                {/* From */}
                <div className="rounded-lg bg-muted/40 border px-3 py-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">You pay</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            className="flex-1 bg-transparent text-2xl font-medium outline-none placeholder:text-muted-foreground/50 min-w-0"
                            placeholder="0"
                            value={fromAmount}
                            onChange={e => {
                                const v = e.target.value;
                                if (/^\d*\.?\d*$/.test(v)) setFromAmount(v);
                            }}
                            inputMode="decimal"
                        />
                        <button
                            onClick={() => openModal("from")}
                            className={cn(
                                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors shrink-0",
                                fromToken
                                    ? "bg-background border hover:bg-accent"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            {fromToken ? (
                                <>
                                    {fromToken.logoURI && (
                                        <img
                                            src={fromToken.logoURI}
                                            alt={fromToken.symbol}
                                            className="size-4 rounded-full"
                                        />
                                    )}
                                    {fromToken.symbol}
                                </>
                            ) : (
                                "Select token"
                            )}
                            <svg
                                className="size-3 text-current opacity-60"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Swap direction */}
                <div className="flex justify-center -my-1 relative z-10">
                    <button
                        onClick={swapDirection}
                        className="rounded-full border bg-background p-1.5 hover:bg-accent transition-colors shadow-sm"
                        aria-label="Swap direction"
                    >
                        <ArrowDownIcon className="size-4" />
                    </button>
                </div>

                {/* To */}
                <div className="rounded-lg bg-muted/40 border px-3 py-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">You receive</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 text-2xl font-medium text-muted-foreground/50 min-w-0">
                            0
                        </div>
                        <button
                            onClick={() => openModal("to")}
                            className={cn(
                                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors shrink-0",
                                toToken
                                    ? "bg-background border hover:bg-accent"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            {toToken ? (
                                <>
                                    {toToken.logoURI && (
                                        <img
                                            src={toToken.logoURI}
                                            alt={toToken.symbol}
                                            className="size-4 rounded-full"
                                        />
                                    )}
                                    {toToken.symbol}
                                </>
                            ) : (
                                "Select token"
                            )}
                            <svg
                                className="size-3 text-current opacity-60"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </button>
                    </div>
                </div>

                <Button className="w-full mt-1" size="lg">
                    Swap
                </Button>
            </div>

            <TokenSelectorModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSelect={handleTokenSelect}
            />
        </>
    );
}

// ---------------------------------------------------------------------------
// Lend tab
// ---------------------------------------------------------------------------

function LendTab() {
    return (
        <div className="flex flex-1 justify-center items-center text-sm text-muted-foreground mt-16">
            Lending coming soon
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SwapPage() {
    const [activeTab, setActiveTab] = useState<Tab>("swap");

    const breadcrumbs = [{ label: "swap.lystic.dev" }];

    return (
        <>
            <Header breadcrumbItems={breadcrumbs}>
                <ConnectButton />
            </Header>

            <main className="flex flex-1 flex-col overflow-hidden">
                {/* Tab bar */}
                <div className="flex justify-center pt-6">
                    <div className="inline-flex rounded-lg border bg-muted p-1 gap-0.5">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-5 py-1.5 rounded-md text-sm font-medium transition-colors",
                                    activeTab === tab.id
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab content */}
                <div className="flex flex-col flex-1 px-4">
                    {activeTab === "swap" ? <SwapTab /> : <LendTab />}
                </div>
            </main>
        </>
    );
}
