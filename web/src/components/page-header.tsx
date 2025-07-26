import "@/styles/globals.css"

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import React from "react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface HeaderProps {
    children: React.ReactNode;
    breadcrumbItems?: BreadcrumbItem[];
}

export function Header({ children, breadcrumbItems }: HeaderProps) {
    const defaultItems: BreadcrumbItem[] = [{ label: "lystic.dev" }];
    const items = breadcrumbItems ?? defaultItems;

    return (
        <>
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            {items.map((item, index) => (
                                <React.Fragment key={index}>
                                    <BreadcrumbItem
                                        className={items.length === 1 ? "hidden md:block" : undefined}
                                    >
                                        {item.href ? (
                                            <BreadcrumbLink href={item.href}>
                                                {item.label}
                                            </BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem>
                                    {index < items.length - 1 && (
                                        <BreadcrumbSeparator className="hidden md:block" />
                                    )}
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <ModeToggle />
            </header>
            <main className="flex flex-1 flex-col overflow-hidden">
                {children}
            </main>
        </>
    )
}