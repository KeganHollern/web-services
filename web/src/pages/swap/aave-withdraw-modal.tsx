import { useState, useMemo } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { maxUint256, parseUnits } from "viem";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LendPosition } from "./use-aave-data";

const AAVE_POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2" as const;

const POOL_ABI = [
    {
        name: "withdraw",
        type: "function",
        inputs: [
            { name: "asset", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "to", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "nonpayable",
    },
] as const;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    position: LendPosition;
}

export function WithdrawModal({ open, onOpenChange, position }: Props) {
    const { address } = useAccount();
    const queryClient = useQueryClient();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();

    const [amount, setAmount] = useState("");
    const [isMax, setIsMax] = useState(false);
    const [busy, setBusy] = useState(false);

    function handleInput(val: string) {
        if (!/^\d*\.?\d*$/.test(val)) return;
        setAmount(val);
        setIsMax(false);
    }

    function handleMax() {
        setAmount(position.depositedAmount);
        setIsMax(true);
    }

    const rawAmount = useMemo((): bigint => {
        if (isMax) return maxUint256;
        try {
            return amount ? parseUnits(amount, position.decimals) : 0n;
        } catch {
            return 0n;
        }
    }, [amount, isMax, position.decimals]);

    const isValid = rawAmount > 0n;

    const usdValue = useMemo(() => {
        if (isMax) return position.depositedAmountUSD;
        const n = parseFloat(amount);
        const dep = parseFloat(position.depositedAmount);
        const depUSD = parseFloat(position.depositedAmountUSD);
        if (!n || !dep || !depUSD) return null;
        return (n * (depUSD / dep)).toFixed(2);
    }, [amount, isMax, position]);

    function handleClose(v: boolean) {
        if (busy) return;
        onOpenChange(v);
        if (!v) { setAmount(""); setIsMax(false); }
    }

    async function handleSubmit() {
        if (!address || !isValid) return;
        setBusy(true);
        const toastId = toast.loading("Confirm in wallet…");

        try {
            const hash = await writeContractAsync({
                address: AAVE_POOL,
                abi: POOL_ABI,
                functionName: "withdraw",
                args: [position.underlyingAsset as `0x${string}`, rawAmount, address],
            });
            toast.loading("Withdrawal submitted…", {
                id: toastId,
                action: {
                    label: "View",
                    onClick: () => window.open(`https://etherscan.io/tx/${hash}`, "_blank"),
                },
            });
            const receipt = await publicClient!.waitForTransactionReceipt({ hash });
            if (receipt.status === "success") {
                const displayAmt = isMax ? position.depositedAmount : amount;
                toast.success(`Withdrew ${displayAmt} ${position.symbol}`, { id: toastId });
                queryClient.invalidateQueries({ queryKey: ["aave-user-reserves"] });
                queryClient.invalidateQueries({ queryKey: ["aave-reserves"] });
                handleClose(false);
            } else {
                toast.error("Withdrawal reverted", { id: toastId });
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

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-sm p-0 gap-0">
                <DialogHeader className="px-4 pt-5 pb-3">
                    <DialogTitle className="flex items-center gap-2">
                        <img
                            src={position.logoURI}
                            alt={position.symbol}
                            className="size-5 rounded-full bg-muted"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                        Withdraw {position.symbol}
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
                            <span className="text-muted-foreground">Deposited</span>
                            <span className="tabular-nums">
                                {position.depositedAmount} {position.symbol}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Value</span>
                            <span className="tabular-nums">${position.depositedAmountUSD}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Supply APY</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                                {position.supplyAPY}%
                            </span>
                        </div>
                    </div>

                    <Button className="w-full" disabled={!isValid || busy} onClick={handleSubmit}>
                        {busy ? "Processing…" : "Withdraw"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
