import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAaveData, type LendPosition, type AvailableAsset } from "./use-aave-data";

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function AssetCell({ symbol, logoURI }: { symbol: string; logoURI: string }) {
    return (
        <div className="flex items-center gap-2">
            <img
                src={logoURI}
                alt={symbol}
                className="size-6 rounded-full bg-muted"
                onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
            />
            <span className="font-medium">{symbol}</span>
        </div>
    );
}

function SkeletonRows({ count, cols }: { count: number; cols: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// ---------------------------------------------------------------------------
// Positions table (Your Deposits)
// ---------------------------------------------------------------------------

function PositionsTable({
    positions,
    loading,
}: {
    positions: LendPosition[];
    loading: boolean;
}) {
    return (
        <section>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Your Positions
            </p>
            <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/40">
                            <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">
                                Asset
                            </th>
                            <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">
                                Deposited
                            </th>
                            <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">
                                APY
                            </th>
                            <th className="w-28 px-4 py-2.5" />
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <SkeletonRows count={2} cols={4} />
                        ) : (
                            positions.map((pos) => (
                                <tr key={pos.underlyingAsset} className="border-b last:border-0">
                                    <td className="px-4 py-3">
                                        <AssetCell
                                            symbol={pos.symbol}
                                            logoURI={pos.logoURI}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        <div>{pos.depositedAmount}</div>
                                        <div className="text-xs text-muted-foreground">
                                            ${pos.depositedAmountUSD}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400 tabular-nums">
                                        {pos.supplyAPY}%
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="outline" size="sm">
                                            Withdraw
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// Available to deposit table
// ---------------------------------------------------------------------------

function AvailableTable({
    assets,
    loading,
}: {
    assets: AvailableAsset[];
    loading: boolean;
}) {
    return (
        <section>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Available to Deposit
            </p>
            <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/40">
                            <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">
                                Asset
                            </th>
                            <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">
                                Wallet Balance
                            </th>
                            <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">
                                APY
                            </th>
                            <th className="w-28 px-4 py-2.5" />
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <SkeletonRows count={3} cols={4} />
                        ) : assets.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                                >
                                    No supported assets found in wallet
                                </td>
                            </tr>
                        ) : (
                            assets.map((a) => (
                                <tr key={a.underlyingAsset} className="border-b last:border-0">
                                    <td className="px-4 py-3">
                                        <AssetCell symbol={a.symbol} logoURI={a.logoURI} />
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        <div>{a.walletBalance}</div>
                                        <div className="text-xs text-muted-foreground">
                                            ${a.walletBalanceUSD}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400 tabular-nums">
                                        {a.supplyAPY}%
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="outline" size="sm">
                                            Deposit
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// LendTab
// ---------------------------------------------------------------------------

export function LendTab() {
    const { address } = useAccount();
    const { userPositions, availableToDeposit, loading, error } = useAaveData();

    if (!address) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 mt-16">
                <p className="text-sm text-muted-foreground">
                    Connect your wallet to lend on Aave v3
                </p>
                <ConnectButton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-1 justify-center items-center text-sm text-destructive mt-16">
                Failed to load lending data — check your connection and try again.
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 flex flex-col gap-6 pb-8">
            {(loading || userPositions.length > 0) && (
                <PositionsTable positions={userPositions} loading={loading} />
            )}
            <AvailableTable assets={availableToDeposit} loading={loading} />
        </div>
    );
}
