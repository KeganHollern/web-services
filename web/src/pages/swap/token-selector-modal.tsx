import { useState, useEffect, useMemo } from "react";
import { useAccount, useBalance } from "wagmi";
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

interface TokenSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (token: Token) => void;
}

export function TokenSelectorModal({
    open,
    onOpenChange,
    onSelect,
}: TokenSelectorModalProps) {
    const { address, isConnected } = useAccount();
    const [tokens, setTokens] = useState<Token[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        if (cachedTokens) {
            setTokens(cachedTokens);
            return;
        }
        setLoading(true);
        fetchTokenList()
            .then(setTokens)
            .finally(() => setLoading(false));
    }, [open]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return tokens.slice(0, 100);
        return tokens.filter(
            t =>
                t.symbol.toLowerCase().includes(q) ||
                t.name.toLowerCase().includes(q) ||
                t.address.toLowerCase() === q
        );
    }, [tokens, search]);

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
                            No tokens found
                        </div>
                    ) : (
                        filtered.map(token => (
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
                                {isConnected && address && (
                                    <TokenBalance token={token} userAddress={address} />
                                )}
                            </button>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
