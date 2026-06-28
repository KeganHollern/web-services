import { Route, Routes } from "react-router";
import { FifaPage } from "./fifa-page";
import { PageNotFound } from "@/pages/404/page";

export function FifaRouter() {
    return (
        <Routes>
            <Route path="/" element={<FifaPage />} />
            <Route path="*" element={<PageNotFound domain="lystic.dev/fifa" />} />
        </Routes>
    )
}
