import { Route, Routes } from "react-router";
import { PingPage } from "./ping-page";
import { PageNotFound } from "@/pages/404/page";

export function PingRouter() {
    return (
        <Routes>
            <Route path="/" element={<PingPage />} />
            <Route path="*" element={<PageNotFound domain="ping.lystic.dev" />} />
        </Routes>
    )
}
