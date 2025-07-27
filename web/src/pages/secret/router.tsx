
import { Route, Routes } from "react-router";
import { SecretPage } from "./page";
import { PageNotFound } from "@/pages/404/page";

export function SecretRouter() {
    return (
        <Routes>
            <Route path="/" element={<SecretPage />} />
            {/* TODO: routing for secrets */}
            <Route path="*" element={<PageNotFound domain="secret.lystic.dev" />} />
        </Routes>
    )
}