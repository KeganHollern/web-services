import { UiPoolDataProvider } from "@aave/contract-helpers";
import { formatReserves, formatUserSummary } from "@aave/math-utils";
import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import { useMemo } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";

// ---------------------------------------------------------------------------
// Aave v3 Ethereum Mainnet contract addresses
// ---------------------------------------------------------------------------

const AAVE_V3 = {
    uiPoolDataProvider: "0x91c0eA31b49B69Ea18607702c5d9aC360bf3dE7d",
    poolAddressesProvider: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
};

const MAINNET_RPCS = [
    "https://cloudflare-eth.com",
    "https://rpc.ankr.com/eth",
    "https://ethereum.publicnode.com",
];

// ---------------------------------------------------------------------------
// Data fetchers (run outside React, called from React Query)
// ---------------------------------------------------------------------------

function makeContract() {
    const provider = new ethers.providers.FallbackProvider(
        MAINNET_RPCS.map((url, i) => ({
            provider: new ethers.providers.JsonRpcProvider(url, 1),
            priority: i + 1,
            stallTimeout: 2000,
        })),
        1
    );
    return new UiPoolDataProvider({
        uiPoolDataProviderAddress: AAVE_V3.uiPoolDataProvider,
        provider,
        chainId: 1,
    });
}

async function fetchAaveReserves() {
    const contract = makeContract();
    const { reservesData, baseCurrencyData } = await contract.getReservesHumanized({
        lendingPoolAddressProvider: AAVE_V3.poolAddressesProvider,
    });
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const formattedReserves = formatReserves({
        reserves: reservesData,
        currentTimestamp,
        marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
        marketReferencePriceInUsd: baseCurrencyData.networkBaseTokenPriceInUsd,
    });
    return { formattedReserves, baseCurrencyData, currentTimestamp };
}

async function fetchUserReserves(user: string) {
    const contract = makeContract();
    return contract.getUserReservesHumanized({
        lendingPoolAddressProvider: AAVE_V3.poolAddressesProvider,
        user,
    });
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface LendPosition {
    underlyingAsset: string;
    symbol: string;
    logoURI: string;
    depositedAmount: string;
    depositedAmountUSD: string;
    supplyAPY: string;
    decimals: number;
}

export interface AvailableAsset {
    underlyingAsset: string;
    symbol: string;
    logoURI: string;
    walletBalance: string;
    walletBalanceRaw: string;  // raw uint256 as decimal string
    walletBalanceUSD: string;
    supplyAPY: string;
    decimals: number;
}

export interface AaveData {
    userPositions: LendPosition[];
    availableToDeposit: AvailableAsset[];
    loading: boolean;
    error: Error | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assetLogo(symbol: string) {
    return `https://app.aave.com/icons/tokens/${symbol.toLowerCase()}.svg`;
}

/** Convert ray-scale APY string (e.g. "0.0312") to display percentage ("3.12") */
function pctAPY(apy: string) {
    return (parseFloat(apy) * 100).toFixed(2);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAaveData(): AaveData {
    const { address } = useAccount();

    const {
        data: reserveData,
        isLoading: reserveLoading,
        error: reserveError,
    } = useQuery({
        queryKey: ["aave-reserves"],
        queryFn: fetchAaveReserves,
        staleTime: 30_000,
        gcTime: 60_000,
    });

    const { data: userReserveData, isLoading: userLoading } = useQuery({
        queryKey: ["aave-user-reserves", address],
        queryFn: () => fetchUserReserves(address!),
        enabled: !!address,
        staleTime: 15_000,
        gcTime: 30_000,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedReserves: any[] = reserveData?.formattedReserves ?? [];
    const baseCurrencyData = reserveData?.baseCurrencyData;
    const currentTimestamp = reserveData?.currentTimestamp ?? Math.floor(Date.now() / 1000);

    // User positions: reserves where aToken balance > 0
    const userPositions = useMemo<LendPosition[]>(() => {
        if (!userReserveData || !formattedReserves.length || !baseCurrencyData) return [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const summary: any = formatUserSummary({
            currentTimestamp,
            marketReferencePriceInUsd: baseCurrencyData.networkBaseTokenPriceInUsd,
            marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
            userReserves: userReserveData.userReserves,
            formattedReserves,
            userEmodeCategoryId: userReserveData.userEmodeCategoryId,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (summary.userReservesData as any[])
            .filter((r) => parseFloat(r.underlyingBalance) > 0)
            .map((r) => {
                const fr = formattedReserves.find(
                    (x) => x.underlyingAsset.toLowerCase() === r.underlyingAsset.toLowerCase()
                );
                return {
                    underlyingAsset: r.underlyingAsset,
                    symbol: r.reserve.symbol,
                    logoURI: assetLogo(r.reserve.symbol),
                    depositedAmount: parseFloat(r.underlyingBalance).toFixed(6),
                    depositedAmountUSD: parseFloat(r.underlyingBalanceUSD).toFixed(2),
                    supplyAPY: pctAPY(fr?.supplyAPY ?? "0"),
                    decimals: r.reserve.decimals,
                } satisfies LendPosition;
            });
    }, [userReserveData, formattedReserves, baseCurrencyData, currentTimestamp]);

    // ERC-20 balance queries for all reserve assets (multicalled by wagmi)
    const balanceContracts = useMemo(() => {
        if (!address) return [];
        return formattedReserves.map((r) => ({
            address: r.underlyingAsset as `0x${string}`,
            abi: erc20Abi,
            functionName: "balanceOf" as const,
            args: [address] as const,
        }));
    }, [formattedReserves, address]);

    const { data: balanceData, isLoading: balanceLoading } = useReadContracts({
        contracts: balanceContracts,
        query: { enabled: !!address && balanceContracts.length > 0 },
    });

    const depositedSet = useMemo(
        () => new Set(userPositions.map((p) => p.underlyingAsset.toLowerCase())),
        [userPositions]
    );

    // Available to deposit: reserves not already deposited, with wallet balance > 0
    const availableToDeposit = useMemo<AvailableAsset[]>(() => {
        if (!address || !formattedReserves.length || !balanceData) return [];

        // ETH price in USD (networkBaseTokenPriceInUsd has 8 implicit decimals)
        const ethPriceUSD =
            parseFloat(baseCurrencyData?.networkBaseTokenPriceInUsd ?? "0") / 1e8;

        return formattedReserves
            .map((r, i) => ({ r, i }))
            .filter(({ r }) => !depositedSet.has(r.underlyingAsset.toLowerCase()))
            .flatMap(({ r, i }) => {
                const result = balanceData[i];
                if (!result || result.status !== "success") return [];

                const raw = result.result as bigint;
                const bal = parseFloat(formatUnits(raw, r.decimals));
                if (bal <= 0) return [];

                // priceInUSD is present when marketReferencePriceInUsd was passed to formatReserves
                const priceUSD =
                    typeof r.priceInUSD === "string"
                        ? parseFloat(r.priceInUSD)
                        : parseFloat(r.formattedPriceInMarketReferenceCurrency ?? "0") *
                        ethPriceUSD;

                return [
                    {
                        underlyingAsset: r.underlyingAsset,
                        symbol: r.symbol,
                        logoURI: assetLogo(r.symbol),
                        walletBalance: bal.toFixed(6),
                        walletBalanceRaw: raw.toString(),
                        walletBalanceUSD: (bal * priceUSD).toFixed(2),
                        supplyAPY: pctAPY(r.supplyAPY),
                        decimals: r.decimals,
                    } satisfies AvailableAsset,
                ];
            })
            .sort((a, b) => parseFloat(b.walletBalanceUSD) - parseFloat(a.walletBalanceUSD));
    }, [address, formattedReserves, balanceData, depositedSet, baseCurrencyData]);

    return {
        userPositions,
        availableToDeposit,
        loading: reserveLoading || (!!address && (userLoading || balanceLoading)),
        error: reserveError as Error | null,
    };
}
