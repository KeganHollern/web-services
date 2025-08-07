import { Route, Routes } from "react-router";
import { HomePage } from "./page";
import { PageNotFound } from "@/pages/404/page";

export function HomeRouter() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    )
}