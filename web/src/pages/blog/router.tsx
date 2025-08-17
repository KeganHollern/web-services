
import { PageNotFound } from "@/pages/404/page";
import { Route, Routes } from "react-router";
import { BlogPage } from "./page";
import { BlogPost } from "./post";

export function BlogRouter() {
    return (
        <Routes>
            <Route path="/" element={<BlogPage />} />
            <Route path="/test" element={<BlogPost />} />
            {/* TODO: routing for blog entires & maybe md to tsx conversion for blog pages? */}
            <Route path="*" element={<PageNotFound domain="blog.lystic.dev" />} />
        </Routes>
    )
}