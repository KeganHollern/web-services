
import { SidebarProvider, SidebarInset, Sidebar as BaseSidebar, SidebarGroup, SidebarContent, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { type LucideProps } from "lucide-react";
import Cookies from 'js-cookie';
import React from "react";

type SidebarItem = {
    title: string
    url: string
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>
}
type SidebarProps = {
    children: React.ReactNode
    items: SidebarItem[]
    title: string
}

export function Sidebar({ children, items, title }: SidebarProps) {
    const open = (Cookies.get('sidebar_state') ?? "true") === "true";

    return (
        <SidebarProvider defaultOpen={open}>
            <BaseSidebar>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>{title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <a href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </BaseSidebar>
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
