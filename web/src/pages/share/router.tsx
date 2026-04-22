import { Route, Routes } from "react-router";

import { PageNotFound } from "@/pages/404/page";

import { SharePage } from "./page";

export function ShareRouter() {
    return (
        <Routes>
            <Route path="/" element={<SharePage />} />
            <Route path="*" element={<PageNotFound domain="share.lystic.dev" />} />
        </Routes>
    );
}
