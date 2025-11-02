
import { PageNotFound } from "@/pages/404/page";
import { Route, Routes } from "react-router";
import { UploadPage } from "./page";

export function UploadRouter() {
    return (
        <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="*" element={<PageNotFound domain="upload.lystic.dev" />} />
        </Routes>
    )
}