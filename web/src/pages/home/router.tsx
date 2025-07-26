import "@/styles/globals.css"

import { Route, Routes } from "react-router";
import { HomePage } from "./page";

export function HomeRouter() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
    )
}