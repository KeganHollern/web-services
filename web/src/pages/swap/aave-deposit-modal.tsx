import { useState, useMemo } from "react";
import { useAccount, useWriteContract, useReadContract, usePublicClient } from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AvailableAsset } from "./use-aave-data";

const AAVE_POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2" as const;

const POOL_ABI = [
    {
        name: "supply",
        type: "function",
        inputs: [
            { name: "asset", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "onBehalfOf", type: "address" },
            { name: "referralCode", type: "uint16" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
] as const;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: AvailableAsset;
}

export function DepositModal({ open, onOpenChange, asset }: Props) {
    const { address } = useAccount();
    const queryClient = useQueryClient();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();

    const [amount, setAmount] = useState("");
    const [rawAmount, setRawAmount] = useState<bigint>(0n);
    const [busy, setBusy] = useState(false);

    function parseAmount(val: string): bigint {
        try {
            return val ? parseUnits(val, asset.decimals) : 0n;
        } catch {
            return 0n;
        }
    }

    function handleInput(val: string) {
        if (!/^\d*\.?\d*$/.test(val)) return;
        setAmount(val);
        setRawAmount(parseAmount(val));
    }

    function handleMax() {
        const raw = BigInt(asset.walletBalanceRaw);
        setRawAmount(raw);
        setAmount(asset.walletBalance);
    }

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: asset.underlyingAsset as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address!, AAVE_POOL],
        query: { enabled: !!address && open },
    });

    const needsApproval = rawAmount > 0n && (allowance ?? 0n) < rawAmount;

    const usdValue = useMemo(() => {
        const n = parseFloat(amount);
        const bal = parseFloat(asset.walletBalance);
        const balUSD = parseFloat(asset.walletBalanceUSD);
        if (!n || !bal || !balUSD) return null;
        return (n * (balUSD / bal)).toFixed(2);
    }, [amount, asset.walletBalance, asset.walletBalanceUSD]);

    function handleClose(v: boolean) {
        if (busy) return;
        onOpenChange(v);
        if (!v) { setAmount(""); setRawAmount(0n); }
    }

    async function handleSubmit() {
        if (!address || !rawAmount) return;
        setBusy(true);
        const toastId = toast.loading("Confirm in wallet…");

        try {
            if (needsApproval) {
                const approveHash = await writeContractAsync({
                    address: asset.underlyingAsset as `0x${string}`,
                    abi: erc20Abi,
                    functionName: "approve",
                    args: [AAVE_POOL, rawAmount],
                });
                toast.loading(`Approving ${asset.symbol}…`, {
                    id: toastId,
                    action: {
                        label: "View",
                        onClick: () => window.open(`https://etherscan.io/tx/${approveHash}`, "_blank"),
                    },
                });
                const approveReceipt = await publicClient!.waitForTransactionReceipt({ hash: approveHash });
                if (approveReceipt.status !== "success") {
                    toast.error("Approval failed", { id: toastId });
                    setBusy(false);
                    return;
                }
                await refetchAllowance();
                toast.loading("Confirm deposit in wallet…", { id: toastId });
            }

            const hash = await writeContractAsync({
                address: AAVE_POOL,
                abi: POOL_ABI,
                functionName: "supply",
                args: [asset.underlyingAsset as `0x${string}`, rawAmount, address, 0],
            });
            toast.loading("Deposit submitted…", {
                id: toastId,
                action: {
                    label: "View",
                    onClick: () => window.open(`https://etherscan.io/tx/${hash}`, "_blank"),
                },
            });
            const receipt = await publicClient!.waitForTransactionReceipt({ hash });
            if (receipt.status === "success") {
                toast.success(`Deposited ${amount} ${asset.symbol}`, { id: toastId });
                queryClient.invalidateQueries({ queryKey: ["aave-user-reserves"] });
                queryClient.invalidateQueries({ queryKey: ["aave-reserves"] });
                handleClose(false);
            } else {
                toast.error("Deposit reverted", { id: toastId });
            }
        } catch (err) {
            const msg = (err as Error).message ?? "";
            const isRejected = msg.toLowerCase().includes("user rejected") || msg.includes("4001");
            if (isRejected) {
                toast.dismiss(toastId);
            } else {
                toast.error("Transaction failed", { id: toastId });
            }
        } finally {
            setBusy(false);
        }
    }

    const buttonLabel = busy
        ? "Processing…"
        : needsApproval
        ? `Approve ${asset.symbol}`
        : "Deposit";

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-sm p-0 gap-0">
                <DialogHeader className="px-4 pt-5 pb-3">
                    <DialogTitle className="flex items-center gap-2">
                        <img
                            src={asset.logoURI}
                            alt={asset.symbol}
                            className="size-5 rounded-full bg-muted"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                        Deposit {asset.symbol}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-4 pb-5 flex flex-col gap-4">
                    <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus
                                className="flex-1 bg-transparent text-lg font-medium outline-none tabular-nums placeholder:text-muted-foreground"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => handleInput(e.target.value)}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-6 px-2 shrink-0"
                                onClick={handleMax}
                            >
                                Max
                            </Button>
                        </div>
                        {usdValue && (
                            <p className="text-xs text-muted-foreground mt-1">≈ ${usdValue}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Supply APY</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                                {asset.supplyAPY}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Wallet balance</span>
                            <span className="tabular-nums">
                                {asset.walletBalance} {asset.symbol}
                            </span>
                        </div>
                    </div>

                    <Button className="w-full" disabled={rawAmount === 0n || busy} onClick={handleSubmit}>
                        {buttonLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
