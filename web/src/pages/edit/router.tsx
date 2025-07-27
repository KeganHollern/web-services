
import { Route, Routes } from "react-router";
import { EditPage } from "./page";
import { PageNotFound } from "@/pages/404/page";

export function EditRouter() {
    return (
        <Routes>
            <Route path="/" element={<EditPage />} />
            {/* TODO: routing for editor */}
            <Route path="*" element={<PageNotFound domain="edit.lystic.dev" />} />
        </Routes>
    )
}