import { useState, useEffect } from "react";
import { createPublicClient, http, parseUnits, formatUnits } from "viem";
import { mainnet } from "viem/chains";
import type { Token } from "./token-selector-modal";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Uniswap v4 Quoter on Ethereum mainnet.
// Verify at: https://github.com/Uniswap/v4-periphery/blob/main/deployments/mainnet.json
const QUOTER_ADDRESS =
    "0x52Af5705A1f6Aba9ea93BcBe5D8e3B3b8B6B4D1C" as `0x${string}`;

const ZERO_ADDRESS =
    "0x0000000000000000000000000000000000000000" as `0x${string}`;

// Uniswap token-list ETH sentinel → v4 uses zero-address for native ETH
const ETH_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

// Try all common fee tiers in parallel and return the best quote
const FEE_TIERS: { fee: number; tickSpacing: number }[] = [
    { fee: 3000, tickSpacing: 60 },   // 0.30%
    { fee: 500, tickSpacing: 10 },    // 0.05%
    { fee: 100, tickSpacing: 1 },     // 0.01%
    { fee: 10000, tickSpacing: 200 }, // 1.00%
];

// ---------------------------------------------------------------------------
// ABI (minimal — quoteExactInputSingle only)
// ---------------------------------------------------------------------------

const QUOTER_ABI = [
    {
        name: "quoteExactInputSingle",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            {
                name: "params",
                type: "tuple",
                components: [
                    {
                        name: "poolKey",
                        type: "tuple",
                        components: [
                            { name: "currency0", type: "address" },
                            { name: "currency1", type: "address" },
                            { name: "fee", type: "uint24" },
                            { name: "tickSpacing", type: "int24" },
                            { name: "hooks", type: "address" },
                        ],
                    },
                    { name: "zeroForOne", type: "bool" },
                    { name: "exactAmount", type: "uint128" },
                    { name: "hookData", type: "bytes" },
                ],
            },
        ],
        outputs: [
            { name: "amountOut", type: "uint256" },
            { name: "sqrtPriceX96After", type: "uint160" },
            { name: "initializedTicksLoaded", type: "uint32" },
        ],
    },
] as const;

// ---------------------------------------------------------------------------
// Viem client (module-level singleton)
// ---------------------------------------------------------------------------

const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toCurrency(token: Token): `0x${string}` {
    return token.address.toLowerCase() === ETH_SENTINEL
        ? ZERO_ADDRESS
        : (token.address as `0x${string}`);
}

function formatAmount(raw: string): string {
    const n = parseFloat(raw);
    if (!isFinite(n) || n === 0) return "0";
    if (n < 0.0001) return "< 0.0001";
    if (n < 1) return n.toPrecision(6).replace(/\.?0+$/, "");
    if (n < 10_000) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

interface QuoterTierResult {
    amountOut: bigint;
    fee: number;
    tickSpacing: number;
    zeroForOne: boolean;
}

async function callQuoter(
    addrIn: `0x${string}`,
    addrOut: `0x${string}`,
    amountInRaw: bigint,
    fee: number,
    tickSpacing: number,
): Promise<QuoterTierResult> {
    const zeroForOne = BigInt(addrIn) < BigInt(addrOut);
    const [currency0, currency1] = zeroForOne
        ? [addrIn, addrOut]
        : [addrOut, addrIn];

    const result = await publicClient.readContract({
        address: QUOTER_ADDRESS,
        abi: QUOTER_ABI,
        functionName: "quoteExactInputSingle",
        args: [
            {
                poolKey: { currency0, currency1, fee, tickSpacing, hooks: ZERO_ADDRESS },
                zeroForOne,
                exactAmount: amountInRaw,
                hookData: "0x" as `0x${string}`,
            },
        ],
    });

    return { amountOut: result[0], fee, tickSpacing, zeroForOne };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuoteResult {
    amountOut: string;          // formatted for display
    amountOutRaw: bigint;
    minimumReceived: string;    // slippage-adjusted, formatted
    minimumReceivedRaw: bigint;
    gasEstimate: string;
    // Winning pool params needed for swap execution
    fee: number;
    tickSpacing: number;
    zeroForOne: boolean;
}

export interface QuoteState {
    result: QuoteResult | null;
    loading: boolean;
    error: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useQuote(
    tokenIn: Token | null,
    tokenOut: Token | null,
    amountIn: string,
    slippageBps: number, // e.g. 50 = 0.5%
): QuoteState {
    const [state, setState] = useState<QuoteState>({
        result: null,
        loading: false,
        error: null,
    });

    useEffect(() => {
        const parsed = parseFloat(amountIn);
        if (!tokenIn || !tokenOut || !amountIn || !isFinite(parsed) || parsed <= 0) {
            setState({ result: null, loading: false, error: null });
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        const timer = setTimeout(async () => {
            try {
                const amountInRaw = parseUnits(amountIn, tokenIn.decimals);
                const addrIn = toCurrency(tokenIn);
                const addrOut = toCurrency(tokenOut);

                // Query all fee tiers in parallel and pick best amountOut
                const settled = await Promise.allSettled(
                    FEE_TIERS.map(({ fee, tickSpacing }) =>
                        callQuoter(addrIn, addrOut, amountInRaw, fee, tickSpacing)
                    )
                );

                let best: QuoterTierResult | null = null;
                for (const r of settled) {
                    if (r.status === "fulfilled" && (best === null || r.value.amountOut > best.amountOut)) {
                        best = r.value;
                    }
                }

                if (best === null) {
                    setState({ result: null, loading: false, error: "No liquidity for this pair" });
                    return;
                }

                const formattedOut = formatUnits(best.amountOut, tokenOut.decimals);
                const minRaw = (best.amountOut * BigInt(10000 - slippageBps)) / BigInt(10000);
                const formattedMin = formatUnits(minRaw, tokenOut.decimals);

                setState({
                    result: {
                        amountOut: formatAmount(formattedOut),
                        amountOutRaw: best.amountOut,
                        minimumReceived: formatAmount(formattedMin),
                        minimumReceivedRaw: minRaw,
                        gasEstimate: "~$2–5",
                        fee: best.fee,
                        tickSpacing: best.tickSpacing,
                        zeroForOne: best.zeroForOne,
                    },
                    loading: false,
                    error: null,
                });
            } catch {
                setState({ result: null, loading: false, error: "No liquidity for this pair" });
            }
        }, 500);

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenIn?.address, tokenOut?.address, amountIn, slippageBps]);

    return state;
}
