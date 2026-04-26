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
    image?: string
    date: string
    tags: string[]
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
    const image: string | undefined = rawMetadata["image"];
    const rawDate = rawMetadata["date"];
    const date: string = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : (rawDate ?? "");
    const rawTags = rawMetadata["tags"];
    const tags: string[] = Array.isArray(rawTags)
        ? rawTags.filter((t): t is string => typeof t === "string")
        : [];


    return {
        filePath,
        metadata: {
            slug,
            title,
            description,
            visible,
            image,
            date,
            tags,
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