
import { Route, Routes } from "react-router";
import { BlogPage } from "./page";
import { PageNotFound } from "@/pages/404/page";

export function BlogRouter() {
    return (
        <Routes>
            <Route path="/" element={<BlogPage />} />
            {/* TODO: routing for blog entires & maybe md to tsx conversion for blog pages? */}
            <Route path="*" element={<PageNotFound domain="blog.lystic.dev" />} />
        </Routes>
    )
}