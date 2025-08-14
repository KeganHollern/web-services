
import { PageNotFound } from "@/pages/404/page";
import { Route, Routes } from "react-router";
import { EditPage } from "./page";

export function EditRouter() {
    return (
        <Routes>
            <Route path="/" element={<EditPage />} />
            <Route path="*" element={<PageNotFound domain="edit.lystic.dev" />} />
        </Routes>
    )
}