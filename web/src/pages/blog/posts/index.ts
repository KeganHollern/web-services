import type { ComponentType } from "react";

export interface MDXModule {
    default: ComponentType;
}

export const Modules = import.meta.glob<MDXModule>("./*.mdx");