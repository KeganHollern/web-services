import { useState, useEffect, useMemo } from "react";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export interface Token {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
}

// Module-level cache — fetched once for the lifetime of the page
let cachedTokens: Token[] | null = null;
let fetchPromise: Promise<Token[]> | null = null;

async function fetchTokenList(): Promise<Token[]> {
    if (cachedTokens) return cachedTokens;
    if (fetchPromise) return fetchPromise;

    fetchPromise = fetch("https://tokens.uniswap.org")
        .then(res => res.json())
        .then((data: { tokens: Token[] }) => {
            cachedTokens = data.tokens.filter(t => t.chainId === 1);
            return cachedTokens;
        });

    return fetchPromise;
}

const ETH_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

// ---------------------------------------------------------------------------
// Hook: batch-fetch balances for all tokens via a single multicall
// Returns tokens with non-zero balances, sorted descending by raw balance
// ---------------------------------------------------------------------------

interface WalletToken extends Token {
    balanceFormatted: string;
}

function useWalletTokens(
    allTokens: Token[],
    address: `0x${string}` | undefined,
    enabled: boolean,
): { walletTokens: WalletToken[]; loading: boolean } {
    // Native ETH balance
    const { data: ethBalance } = useBalance({
        address,
        query: { enabled: enabled && !!address },
    });

    // Build multicall contracts for all ERC-20 tokens
    const erc20Tokens = useMemo(
        () => allTokens.filter(t => t.address.toLowerCase() !== ETH_SENTINEL),
        [allTokens],
    );

    const contracts = useMemo(
        () =>
            address
                ? erc20Tokens.map(t => ({
                      address: t.address as `0x${string}`,
                      abi: erc20Abi,
                      functionName: "balanceOf" as const,
                      args: [address] as const,
                  }))
                : [],
        [erc20Tokens, address],
    );

    const { data: balances, isLoading } = useReadContracts({
        contracts,
        query: { enabled: enabled && contracts.length > 0 },
    });

    const walletTokens = useMemo(() => {
        const result: WalletToken[] = [];

        // Add native ETH if balance > 0
        if (ethBalance && ethBalance.value > 0n) {
            const ethToken = allTokens.find(
                t => t.address.toLowerCase() === ETH_SENTINEL,
            );
            if (ethToken) {
                const val = parseFloat(ethBalance.formatted);
                result.push({
                    ...ethToken,
                    balanceFormatted:
                        val < 0.0001 ? "<0.0001" : val.toFixed(4),
                });
            }
        }

        // Add ERC-20 tokens with non-zero balances
        if (balances) {
            for (let i = 0; i < erc20Tokens.length; i++) {
                const res = balances[i];
                if (res?.status === "success" && (res.result as bigint) > 0n) {
                    const raw = res.result as bigint;
                    const token = erc20Tokens[i];
                    const val = parseFloat(formatUnits(raw, token.decimals));
                    result.push({
                        ...token,
                        balanceFormatted:
                            val < 0.0001 ? "<0.0001" : val.toFixed(4),
                    });
                }
            }
        }

        return result;
    }, [allTokens, erc20Tokens, ethBalance, balances]);

    return { walletTokens, loading: isLoading };
}

// ---------------------------------------------------------------------------
// Per-token balance (used for "to" / browse mode only)
// ---------------------------------------------------------------------------

function TokenBalance({
    token,
    userAddress,
}: {
    token: Token;
    userAddress: `0x${string}`;
}) {
    const isNative = token.address.toLowerCase() === ETH_SENTINEL;
    const { data } = useBalance({
        address: userAddress,
        token: isNative ? undefined : (token.address as `0x${string}`),
    });

    if (!data) return <span className="text-xs text-muted-foreground">--</span>;

    const val = parseFloat(data.formatted);
    const display = val === 0 ? "0" : val < 0.0001 ? "<0.0001" : val.toFixed(4);

    return <span className="text-sm tabular-nums">{display}</span>;
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

interface TokenSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (token: Token) => void;
    /** "from" shows only wallet-held tokens; "to" shows full Uniswap list */
    mode?: "from" | "to";
}

export function TokenSelectorModal({
    open,
    onOpenChange,
    onSelect,
    mode = "to",
}: TokenSelectorModalProps) {
    const { address, isConnected } = useAccount();
    const [allTokens, setAllTokens] = useState<Token[]>([]);
    const [search, setSearch] = useState("");
    const [listLoading, setListLoading] = useState(false);

    // Always fetch the Uniswap list (needed for metadata in both modes)
    useEffect(() => {
        if (!open) return;
        if (cachedTokens) {
            setAllTokens(cachedTokens);
            return;
        }
        setListLoading(true);
        fetchTokenList()
            .then(setAllTokens)
            .finally(() => setListLoading(false));
    }, [open]);

    // Wallet-held tokens (only active in "from" mode with connected wallet)
    const walletMode = mode === "from" && isConnected && !!address;
    const { walletTokens, loading: walletLoading } = useWalletTokens(
        allTokens,
        address,
        walletMode,
    );

    const loading = listLoading || (walletMode && walletLoading);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        if (walletMode) {
            // "You pay" — only tokens in wallet
            if (!q) return walletTokens;
            return walletTokens.filter(
                t =>
                    t.symbol.toLowerCase().includes(q) ||
                    t.name.toLowerCase().includes(q) ||
                    t.address.toLowerCase() === q,
            );
        }

        // "You receive" — full Uniswap list
        if (!q) return allTokens.slice(0, 100);
        return allTokens.filter(
            t =>
                t.symbol.toLowerCase().includes(q) ||
                t.name.toLowerCase().includes(q) ||
                t.address.toLowerCase() === q,
        );
    }, [walletMode, walletTokens, allTokens, search]);

    function handleSelect(token: Token) {
        onSelect(token);
        onOpenChange(false);
        setSearch("");
    }

    return (
        <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setSearch(""); }}>
            <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-4 pt-5 pb-3">
                    <DialogTitle>Select a token</DialogTitle>
                </DialogHeader>

                <div className="px-4 pb-3">
                    <input
                        autoFocus
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
                        placeholder="Search name, symbol, or address"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="border-t" />

                <div className="overflow-y-auto max-h-[400px]">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            Loading tokens…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            {walletMode ? "No tokens in wallet" : "No tokens found"}
                        </div>
                    ) : (
                        filtered.map(token => {
                            const wt = walletMode
                                ? (token as WalletToken)
                                : null;
                            return (
                                <button
                                    key={token.address}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left disabled:opacity-50"
                                    onClick={() => handleSelect(token)}
                                >
                                    {token.logoURI ? (
                                        <img
                                            src={token.logoURI}
                                            alt={token.symbol}
                                            className="size-8 rounded-full shrink-0 bg-muted"
                                            onError={e => {
                                                (e.currentTarget as HTMLImageElement).style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        <div className="size-8 rounded-full bg-muted shrink-0 flex items-center justify-center text-xs font-semibold">
                                            {token.symbol[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{token.symbol}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {token.name}
                                        </div>
                                    </div>
                                    {wt ? (
                                        <span className="text-sm tabular-nums">
                                            {wt.balanceFormatted}
                                        </span>
                                    ) : (
                                        isConnected && address && (
                                            <TokenBalance token={token} userAddress={address} />
                                        )
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
