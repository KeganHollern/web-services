
import { PageNotFound } from "@/pages/404/page";
import { Route, Routes } from "react-router";
import { BlogPage } from "./page";
import { Post } from "./post";
import { Modules } from "./posts";

import { lazy } from "react";
import TestPage from "./typeography.mdx";

export function BlogRouter() {
    const routes = Object.entries(Modules).map(([filePath, importFn]) => {
        // TODO: maybe we can embed these as metadata in the file?
        const slug = filePath.split("/").pop()?.replace(".mdx", "") ?? "";
        const title = slug.replaceAll("-", " ");

        const LazyPost = lazy(() =>
            importFn().then((module) => ({
                default: () => (<module.default />),
            }))
        );

        return (
            <Route path={`:year?/:month?/:day?/${slug}`}>
                <Route index element={
                    <Post title={title}>
                        <LazyPost />
                    </Post>
                } />
            </Route>
        )
    })

    return (
        <Routes>
            {/* home page */}
            <Route path="/" element={<BlogPage />} />

            {
                // if development then inject /test/ typography page
                process.env.NODE_ENV === "development" ? (
                    <Route path="/test">
                        <Route index element={
                            <Post title="test">
                                <TestPage />
                            </Post>
                        } />
                    </Route>
                ) : (<></>)
            }

            {routes}

            {/* for any blog post route not defined */}
            <Route path="*" element={<PageNotFound domain="blog.lystic.dev" />} />
        </Routes >
    )
}