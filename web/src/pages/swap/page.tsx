import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowDownIcon, Loader2Icon } from "lucide-react";
import { Header } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { TokenSelectorModal, type Token } from "./token-selector-modal";
import { useQuote } from "./use-quote";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLIPPAGE_PRESETS = [0.1, 0.5, 1] as const;
type SlippagePreset = (typeof SLIPPAGE_PRESETS)[number];

const ETH_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

// ---------------------------------------------------------------------------
// USD price hook (CoinGecko simple price)
// ---------------------------------------------------------------------------

function useTokenPrices(tokens: (Token | null)[]): Record<string, number> {
    const [prices, setPrices] = useState<Record<string, number>>({});

    const key = tokens
        .filter(Boolean)
        .map(t => t!.address.toLowerCase())
        .join(",");

    useEffect(() => {
        if (!key) return;

        const addrs = key.split(",");
        const nativeAddrs = addrs.filter(a => a === ETH_SENTINEL);
        const erc20Addrs = addrs.filter(a => a !== ETH_SENTINEL);

        const fetches: Promise<void>[] = [];

        if (nativeAddrs.length) {
            fetches.push(
                fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
                )
                    .then(r => r.json())
                    .then((d: { ethereum?: { usd: number } }) => {
                        if (d.ethereum?.usd)
                            setPrices(p => ({ ...p, [ETH_SENTINEL]: d.ethereum!.usd }));
                    })
                    .catch(() => {})
            );
        }

        if (erc20Addrs.length) {
            fetches.push(
                fetch(
                    `https://api.coingecko.com/api/v3/simple/token_price/ethereum` +
                    `?contract_addresses=${erc20Addrs.join(",")}&vs_currencies=usd`
                )
                    .then(r => r.json())
                    .then((d: Record<string, { usd?: number }>) => {
                        const updates: Record<string, number> = {};
                        for (const [addr, val] of Object.entries(d)) {
                            if (val?.usd) updates[addr.toLowerCase()] = val.usd;
                        }
                        setPrices(p => ({ ...p, ...updates }));
                    })
                    .catch(() => {})
            );
        }

        Promise.allSettled(fetches);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    return prices;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function fmtUsd(amount: string | number, unitPrice: number): string {
    const val = typeof amount === "string" ? parseFloat(amount.replace(/,/g, "")) : amount;
    if (!isFinite(val) || val <= 0) return "";
    const usd = val * unitPrice;
    if (usd < 0.01) return "< $0.01";
    return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtImpact(fromUsd: number, toUsd: number): string {
    if (fromUsd <= 0) return "";
    const pct = ((fromUsd - toUsd) / fromUsd) * 100;
    if (pct < 0) return "< 0.01%";
    return `${pct.toFixed(2)}%`;
}

// ---------------------------------------------------------------------------
// Token button
// ---------------------------------------------------------------------------

function TokenButton({
    token,
    onClick,
}: {
    token: Token | null;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors shrink-0",
                token
                    ? "bg-background border hover:bg-accent"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
        >
            {token ? (
                <>
                    {token.logoURI && (
                        <img
                            src={token.logoURI}
                            alt={token.symbol}
                            className="size-4 rounded-full"
                        />
                    )}
                    {token.symbol}
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
    );
}

// ---------------------------------------------------------------------------
// Slippage settings panel
// ---------------------------------------------------------------------------

function SlippageSettings({
    slippagePct,
    onChangeSlippagePct,
}: {
    slippagePct: number;
    onChangeSlippagePct: (pct: number) => void;
}) {
    const [customText, setCustomText] = useState("");
    const isCustom = !SLIPPAGE_PRESETS.includes(slippagePct as SlippagePreset);
    const [open, setOpen] = useState(false);

    function selectPreset(p: SlippagePreset) {
        setCustomText("");
        onChangeSlippagePct(p);
    }

    function handleCustomChange(v: string) {
        if (!/^\d*\.?\d*$/.test(v)) return;
        setCustomText(v);
        const n = parseFloat(v);
        if (isFinite(n) && n >= 0 && n <= 50) onChangeSlippagePct(n);
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
                <svg
                    className={cn("size-3 transition-transform", open && "rotate-180")}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
                Slippage: {slippagePct}%
            </button>

            {open && (
                <div className="flex items-center gap-1.5 flex-wrap">
                    {SLIPPAGE_PRESETS.map(p => (
                        <button
                            key={p}
                            onClick={() => selectPreset(p)}
                            className={cn(
                                "rounded-md px-2.5 py-1 text-xs font-medium border transition-colors",
                                slippagePct === p && !isCustom
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "hover:bg-accent"
                            )}
                        >
                            {p}%
                        </button>
                    ))}
                    <div className="relative flex items-center">
                        <input
                            className={cn(
                                "w-16 rounded-md border px-2 py-1 text-xs bg-background outline-none",
                                "focus-visible:ring-2 focus-visible:ring-ring/50 text-right",
                                isCustom ? "border-primary" : ""
                            )}
                            placeholder="Custom"
                            value={customText}
                            onChange={e => handleCustomChange(e.target.value)}
                            onFocus={() => { if (!isCustom) setCustomText(""); }}
                            inputMode="decimal"
                        />
                        <span className="absolute right-2 text-xs text-muted-foreground pointer-events-none">
                            %
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Quote details row
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="tabular-nums font-medium">{value}</span>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Swap tab
// ---------------------------------------------------------------------------

type ModalTarget = "from" | "to";

function SwapTab() {
    const { isConnected } = useAccount();

    const [fromToken, setFromToken] = useState<Token | null>(null);
    const [toToken, setToToken] = useState<Token | null>(null);
    const [fromAmount, setFromAmount] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTarget, setModalTarget] = useState<ModalTarget>("from");
    const [slippagePct, setSlippagePct] = useState(0.5);

    const slippageBps = Math.round(slippagePct * 100);
    const { result: quote, loading: quoteLoading, error: quoteError } = useQuote(
        fromToken,
        toToken,
        fromAmount,
        slippageBps,
    );

    const prices = useTokenPrices([fromToken, toToken]);
    const fromUnitPrice = fromToken ? prices[fromToken.address.toLowerCase()] : undefined;
    const toUnitPrice = toToken ? prices[toToken.address.toLowerCase()] : undefined;

    const fromUsd = fromUnitPrice && fromAmount ? fmtUsd(fromAmount, fromUnitPrice) : "";
    const toUsd = toUnitPrice && quote ? fmtUsd(quote.amountOut, toUnitPrice) : "";

    const fromUsdNum = fromUnitPrice && fromAmount
        ? parseFloat(fromAmount) * fromUnitPrice
        : 0;
    const toUsdNum = toUnitPrice && quote
        ? parseFloat(quote.amountOut.replace(/,/g, "")) * toUnitPrice
        : 0;
    const priceImpact =
        fromUsdNum > 0 && toUsdNum > 0 ? fmtImpact(fromUsdNum, toUsdNum) : "";

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

    function flipTokens() {
        setFromToken(toToken);
        setToToken(fromToken);
        setFromAmount(quote?.amountOut.replace(/,/g, "") ?? "");
    }

    const swapDisabled = !isConnected || !quote || quoteLoading;

    return (
        <>
            <div className="w-full max-w-sm mx-auto mt-8 rounded-xl border bg-background shadow-sm p-4 flex flex-col gap-3">

                {/* ── From ── */}
                <div className="rounded-lg bg-muted/40 border px-3 py-3 flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">You pay</span>
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
                        <TokenButton token={fromToken} onClick={() => openModal("from")} />
                    </div>
                    {fromUsd && (
                        <span className="text-xs text-muted-foreground">{fromUsd}</span>
                    )}
                </div>

                {/* ── Flip ── */}
                <div className="flex justify-center -my-1 relative z-10">
                    <button
                        onClick={flipTokens}
                        className="rounded-full border bg-background p-1.5 hover:bg-accent transition-colors shadow-sm"
                        aria-label="Flip tokens"
                    >
                        <ArrowDownIcon className="size-4" />
                    </button>
                </div>

                {/* ── To ── */}
                <div className="rounded-lg bg-muted/40 border px-3 py-3 flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">You receive</span>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 flex items-center">
                            {quoteLoading ? (
                                <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
                            ) : (
                                <span
                                    className={cn(
                                        "text-2xl font-medium",
                                        quote ? "text-foreground" : "text-muted-foreground/50"
                                    )}
                                >
                                    {quote?.amountOut ?? "0"}
                                </span>
                            )}
                        </div>
                        <TokenButton token={toToken} onClick={() => openModal("to")} />
                    </div>
                    {toUsd && (
                        <span className="text-xs text-muted-foreground">{toUsd}</span>
                    )}
                </div>

                {/* ── Slippage ── */}
                <SlippageSettings
                    slippagePct={slippagePct}
                    onChangeSlippagePct={setSlippagePct}
                />

                {/* ── Quote error ── */}
                {quoteError && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive text-center">
                        {quoteError}
                    </div>
                )}

                {/* ── Quote details ── */}
                {quote && toToken && (
                    <div className="rounded-lg border bg-muted/20 px-3 py-2.5 flex flex-col gap-1.5">
                        <DetailRow
                            label="Expected output"
                            value={`${quote.amountOut} ${toToken.symbol}`}
                        />
                        {priceImpact && (
                            <DetailRow label="Price impact" value={priceImpact} />
                        )}
                        <DetailRow
                            label={`Min. received (${slippagePct}% slippage)`}
                            value={`${quote.minimumReceived} ${toToken.symbol}`}
                        />
                        <DetailRow label="Est. gas" value={quote.gasEstimate} />
                    </div>
                )}

                {/* ── Swap button ── */}
                <Button
                    className="w-full mt-1"
                    size="lg"
                    disabled={swapDisabled}
                >
                    {!isConnected
                        ? "Connect wallet to swap"
                        : quoteLoading
                        ? "Getting quote…"
                        : quoteError
                        ? "No route found"
                        : "Swap"}
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
// Tab navigation
// ---------------------------------------------------------------------------

type Tab = "swap" | "lend";

const TABS: { id: Tab; label: string }[] = [
    { id: "swap", label: "Swap" },
    { id: "lend", label: "Lend" },
];

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

                <div className="flex flex-col flex-1 px-4">
                    {activeTab === "swap" ? <SwapTab /> : <LendTab />}
                </div>
            </main>
        </>
    );
}
