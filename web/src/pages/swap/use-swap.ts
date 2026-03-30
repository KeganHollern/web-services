import { useCallback, useState } from "react";
import { useAccount, useSendTransaction, useWriteContract, usePublicClient } from "wagmi";
import {
    encodeFunctionData,
    encodePacked,
    erc20Abi,
    parseUnits,
    maxUint256,
    zeroAddress,
    type Hash,
} from "viem";
import { toast } from "sonner";
import { Actions, V4Planner } from "@uniswap/v4-sdk";
import { CommandType } from "@uniswap/universal-router-sdk";
import type { Token } from "./token-selector-modal";
import type { QuoteResult } from "./use-quote";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;

// Universal Router v2.0 — the v4-compatible deployment on Ethereum mainnet.
// Source: @uniswap/universal-router-sdk UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V2_0, 1)
const UNIVERSAL_ROUTER_ADDRESS = "0x66a9893cc07d91d95644aedd05d03f95e1dba8af" as const;

const ETH_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

// Max values for Permit2 approvals
const MAX_UINT48 = 2n ** 48n - 1n;
const MAX_UINT160 = 2n ** 160n - 1n;

// ---------------------------------------------------------------------------
// ABIs
// ---------------------------------------------------------------------------

const PERMIT2_ABI = [
    {
        name: "allowance",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "owner", type: "address" },
            { name: "token", type: "address" },
            { name: "spender", type: "address" },
        ],
        outputs: [
            { name: "amount", type: "uint160" },
            { name: "expiry", type: "uint48" },
            { name: "nonce", type: "uint48" },
        ],
    },
    {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "token", type: "address" },
            { name: "spender", type: "address" },
            { name: "amount", type: "uint160" },
            { name: "expiration", type: "uint48" },
        ],
        outputs: [],
    },
] as const;

const UNIVERSAL_ROUTER_ABI = [
    {
        name: "execute",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "commands", type: "bytes" },
            { name: "inputs", type: "bytes[]" },
            { name: "deadline", type: "uint256" },
        ],
        outputs: [],
    },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toCurrencyAddress(token: Token): string {
    return token.address.toLowerCase() === ETH_SENTINEL
        ? zeroAddress
        : token.address;
}

function isNativeETH(token: Token): boolean {
    return token.address.toLowerCase() === ETH_SENTINEL;
}

function isUserRejected(err: unknown): boolean {
    if (err == null) return false;
    const code = (err as any)?.code ?? (err as any)?.cause?.code;
    if (code === 4001 || code === "ACTION_REJECTED") return true;
    const msg = String((err as any)?.message ?? "").toLowerCase();
    return msg.includes("user rejected") || msg.includes("user denied");
}

function isInsufficientFunds(err: unknown): boolean {
    const msg = String((err as any)?.message ?? "").toLowerCase();
    return msg.includes("insufficient funds") || msg.includes("insufficient balance");
}

function toastError(err: unknown, fallback: string) {
    const msg = (err as any)?.shortMessage ?? (err as any)?.details ?? (err as any)?.message ?? fallback;
    toast.error(String(msg).length > 120 ? fallback : String(msg));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSwap() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { sendTransactionAsync } = useSendTransaction();
    const { writeContractAsync } = useWriteContract();
    const [isSwapping, setIsSwapping] = useState(false);

    const executeSwap = useCallback(
        async (
            tokenIn: Token,
            tokenOut: Token,
            fromAmount: string,
            quote: QuoteResult,
            onSuccess: () => void,
        ) => {
            if (!address || !publicClient) return;

            const amountIn = parseUnits(fromAmount, tokenIn.decimals);
            const currencyIn = toCurrencyAddress(tokenIn);
            const currencyOut = toCurrencyAddress(tokenOut);
            const nativeIn = isNativeETH(tokenIn);

            setIsSwapping(true);

            try {
                // ── Step 1: ERC20 → Permit2 approval ────────────────────────────────
                if (!nativeIn) {
                    const erc20Allowance = await publicClient.readContract({
                        address: currencyIn as `0x${string}`,
                        abi: erc20Abi,
                        functionName: "allowance",
                        args: [address, PERMIT2_ADDRESS],
                    });

                    if (erc20Allowance < amountIn) {
                        const id = toast.loading("Approve token — awaiting confirmation");
                        try {
                            const tx = await writeContractAsync({
                                address: currencyIn as `0x${string}`,
                                abi: erc20Abi,
                                functionName: "approve",
                                args: [PERMIT2_ADDRESS, maxUint256],
                            });
                            toast.loading("Waiting for approval…", { id });
                            await publicClient.waitForTransactionReceipt({ hash: tx });
                            toast.success("Token approved", { id });
                        } catch (err) {
                            toast.dismiss(id);
                            if (isUserRejected(err)) { toast.error("Approval rejected"); return; }
                            toastError(err, "Approval failed");
                            return;
                        }
                    }

                    // ── Step 2: Permit2 → Universal Router approval ──────────────────
                    const [p2Amount, p2Expiry] = await publicClient.readContract({
                        address: PERMIT2_ADDRESS,
                        abi: PERMIT2_ABI,
                        functionName: "allowance",
                        args: [address, currencyIn as `0x${string}`, UNIVERSAL_ROUTER_ADDRESS],
                    });

                    const now = BigInt(Math.floor(Date.now() / 1000));
                    if (p2Amount < amountIn || p2Expiry <= now) {
                        const id = toast.loading("Approve Permit2 — awaiting confirmation");
                        try {
                            const tx = await writeContractAsync({
                                address: PERMIT2_ADDRESS,
                                abi: PERMIT2_ABI,
                                functionName: "approve",
                                args: [currencyIn as `0x${string}`, UNIVERSAL_ROUTER_ADDRESS, MAX_UINT160, Number(MAX_UINT48)],
                            });
                            toast.loading("Waiting for Permit2 approval…", { id });
                            await publicClient.waitForTransactionReceipt({ hash: tx });
                            toast.success("Permit2 approved", { id });
                        } catch (err) {
                            toast.dismiss(id);
                            if (isUserRejected(err)) { toast.error("Approval rejected"); return; }
                            toastError(err, "Approval failed");
                            return;
                        }
                    }
                }

                // ── Step 3: Build V4 swap calldata via @uniswap/universal-router-sdk ──
                const [currency0, currency1] = quote.zeroForOne
                    ? [currencyIn, currencyOut]
                    : [currencyOut, currencyIn];

                // V4Planner encodes actions as (bytes actions, bytes[] params) for the
                // Universal Router's V4_SWAP command (CommandType.V4_SWAP = 0x10).
                const planner = new V4Planner();

                planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [
                    {
                        poolKey: {
                            currency0,
                            currency1,
                            fee: quote.fee,
                            tickSpacing: quote.tickSpacing,
                            hooks: zeroAddress,
                        },
                        zeroForOne: quote.zeroForOne,
                        amountIn: amountIn.toString(),
                        amountOutMinimum: quote.minimumReceivedRaw.toString(),
                        hookData: "0x",
                    },
                ]);

                // SETTLE_ALL pays the PoolManager for tokenIn (via Permit2, or ETH from tx value)
                planner.addAction(Actions.SETTLE_ALL, [
                    currencyIn,
                    amountIn.toString(),
                ]);

                // TAKE_ALL sends tokenOut from PoolManager directly to the caller (user)
                planner.addAction(Actions.TAKE_ALL, [
                    currencyOut,
                    quote.minimumReceivedRaw.toString(),
                ]);

                const v4Input = planner.finalize() as `0x${string}`;
                const commands = encodePacked(["uint8"], [CommandType.V4_SWAP]);
                const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

                const calldata = encodeFunctionData({
                    abi: UNIVERSAL_ROUTER_ABI,
                    functionName: "execute",
                    args: [commands, [v4Input], deadline],
                });

                // ── Step 4: Send swap transaction ────────────────────────────────────
                const swapId = toast.loading("Awaiting confirmation");

                let txHash: Hash;
                try {
                    txHash = await sendTransactionAsync({
                        to: UNIVERSAL_ROUTER_ADDRESS,
                        data: calldata,
                        value: nativeIn ? amountIn : 0n,
                    });
                } catch (err) {
                    toast.dismiss(swapId);
                    if (isUserRejected(err)) { toast.error("Transaction rejected"); return; }
                    if (isInsufficientFunds(err)) { toast.error("Insufficient balance"); return; }
                    const msg = String((err as any)?.message ?? "").toLowerCase();
                    if (msg.includes("gas")) {
                        toast.error("Gas estimation failed — route may be invalid");
                    } else {
                        toastError(err, "Transaction failed");
                    }
                    return;
                }

                const explorerUrl = `https://etherscan.io/tx/${txHash}`;
                toast.loading("Transaction submitted", {
                    id: swapId,
                    action: {
                        label: "View",
                        onClick: () => window.open(explorerUrl, "_blank"),
                    },
                });

                // ── Step 5: Wait for confirmation ────────────────────────────────────
                const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

                if (receipt.status === "success") {
                    toast.success("Swap complete", {
                        id: swapId,
                        action: {
                            label: "View",
                            onClick: () => window.open(explorerUrl, "_blank"),
                        },
                    });
                    onSuccess();
                } else {
                    toast.error("Transaction failed", {
                        id: swapId,
                        action: {
                            label: "View",
                            onClick: () => window.open(explorerUrl, "_blank"),
                        },
                    });
                }
            } catch (err) {
                toastError(err, "Swap failed");
            } finally {
                setIsSwapping(false);
            }
        },
        [address, publicClient, sendTransactionAsync, writeContractAsync],
    );

    return { executeSwap, isSwapping };
}
