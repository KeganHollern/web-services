
import { Route, Routes } from "react-router";
import { SwapPage } from "./page";
import { PageNotFound } from "@/pages/404/page";
import { SwapWeb3Provider } from "./web3-provider";

export function SwapRouter() {
    return (
        <SwapWeb3Provider>
            <Routes>
                <Route path="/" element={<SwapPage />} />
                <Route path="*" element={<PageNotFound domain="swap.lystic.dev" />} />
            </Routes>
        </SwapWeb3Provider>
    )
}