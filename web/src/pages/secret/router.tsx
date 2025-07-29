
import { Route, Routes } from "react-router";
import { SecretEditorPage } from "./editor";
import { SecretViewerPage } from "./viewer";
import { PageNotFound } from "@/pages/404/page";

export function SecretRouter() {
    return (
        <Routes>
            <Route path="/" element={<SecretEditorPage />} />
            <Route path="/s/:id" element={<SecretViewerPage />} />
            <Route path="*" element={<PageNotFound domain="secret.lystic.dev" />} />
        </Routes>
    )
}