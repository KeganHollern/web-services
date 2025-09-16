import matter, { type Input } from "gray-matter";
import type { ComponentType } from "react";

export interface MDXModule {
    default: ComponentType;
}
export interface PostMetadata {
    slug: string
    title: string
    description: string
    visible: boolean
    // TODO: date?
    // TODO: tags[]

    // uncertain if i want/need these...
    // TODO: image? (optional)
}
export interface PostModule {
    filePath: string,
    metadata: PostMetadata;
    importFn: () => Promise<MDXModule>;
}

// TODO: go through posts and double check slugs match wordpress slugs!
const _modules = import.meta.glob<MDXModule>("./**/*.mdx");
const _raw = import.meta.glob<Input | { content: Input; }>("./**/*.mdx", { query: '?raw', import: 'default', eager: true });


export const Modules = Object.entries(_modules).map(([filePath, importFn]): PostModule => {
    const rawContent = _raw[filePath];
    const { data: rawMetadata } = matter(rawContent);

    const slug: string = rawMetadata["slug"] ?? filePath.split("/").pop()?.replace(".mdx", "") ?? "";
    const title: string = rawMetadata["title"] ?? slug.replaceAll("-", " ") ?? "";
    const description = rawMetadata["description"] ?? "";
    const visible = rawMetadata["visible"] ?? "true"


    return {
        filePath,
        metadata: {
            slug,
            title,
            description,
            visible
        },
        importFn,
    }
}).filter((module) => module.metadata.visible && module.metadata.slug !== "" && module.metadata.description !== "" && module.metadata.description !== "")
    .sort((a: PostModule, b: PostModule): number => {
        const yearA = parseInt(a.filePath.split("/").reverse()[1]);
        const yearB = parseInt(b.filePath.split("/").reverse()[1]);

        if (yearA != yearB) {
            return yearB - yearA
        }

        // years match, sort by something else
        return a.filePath.localeCompare(b.filePath)
    })