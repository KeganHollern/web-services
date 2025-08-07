
import React from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { SubdomainSelector } from "@/components/subdomain-selector";


interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface HeaderProps {
    children?: React.ReactNode;
    breadcrumbItems?: BreadcrumbItem[];
}

export function Header({ children, breadcrumbItems }: HeaderProps) {
    const defaultItems: BreadcrumbItem[] = [{ label: "lystic.dev" }];
    const items = breadcrumbItems ?? defaultItems;


    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 py-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
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
                <div className="ml-auto flex items-center gap-2">
                    <SubdomainSelector />
                    {children}
                    <ThemeToggle />
                </div>
            </div>
        </header>

    )
}