import matter, { type Input } from "gray-matter";
import type { ComponentType } from "react";

export interface MDXModule {
    default: ComponentType;
}
export interface PostMetadata {
    slug: string
    title: string
    description: string
    // TODO: image?
}
export interface PostModule {
    filePath: string,
    metadata: PostMetadata;
    importFn: () => Promise<MDXModule>;
}

const _modules = import.meta.glob<MDXModule>("./**/*.mdx");
const _raw = import.meta.glob<Input | { content: Input; }>("./**/*.mdx", { query: '?raw', import: 'default', eager: true });


export const Modules = Object.entries(_modules).map(([filePath, importFn]): PostModule => {
    const rawContent = _raw[filePath];
    const { data: rawMetadata } = matter(rawContent);

    const slug: string = rawMetadata["slug"] ?? filePath.split("/").pop()?.replace(".mdx", "") ?? "";
    const title: string = rawMetadata["title"] ?? slug.replaceAll("-", " ") ?? "";
    const description = rawMetadata["description"] ?? "";

    return {
        filePath,
        metadata: {
            slug,
            title,
            description
        },
        importFn,
    }
}).filter((module) => module.metadata.slug !== "" && module.metadata.description !== "" && module.metadata.description !== "")
    .reverse() // TODO: improve sorting based on folder or something