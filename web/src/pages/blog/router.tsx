
import { PageNotFound } from "@/pages/404/page";
import { Route, Routes } from "react-router";
import { BlogPage } from "./page";
import { Post } from "./post";
import { Modules, type PostModule } from "./posts";

import { lazy } from "react";
import TestPage from "./typeography.mdx";

export function BlogRouter() {
    const routes = Modules.map(({ metadata, importFn }: PostModule) => {

        const LazyPost = lazy(() =>
            importFn().then((module) => ({
                default: () => (<module.default />),
            }))
        );

        return (
            <Route path={`:year?/:month?/:day?/${metadata.slug}`}>
                <Route index element={
                    <Post title={metadata.title}>
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