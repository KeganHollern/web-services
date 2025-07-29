
import { Route, Routes } from "react-router";
import { SwapPage } from "./page";
import { PageNotFound } from "@/pages/404/page";

export function SwapRouter() {
    return (
        <Routes>
            <Route path="/" element={<SwapPage />} />
            <Route path="*" element={<PageNotFound domain="swap.lystic.dev" />} />
        </Routes>
    )
}