# Event Admin — Layout & Sidebar (AdminLayout.tsx)

> **Role**: Sidenav navigation and page wrapping.
> **Location**: `presentations/Admin/AdminLayout.tsx`

```tsx
"use client";

import * as React from "react";
import {
    Calendar,
    LayoutDashboard,
    LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";

/**
 * NAV_ITEMS STRICTLY LIMITED TO 2 LINKS FOR MVP
 */
const NAV_ITEMS = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Bookings", url: "/admin", icon: Calendar },
];

export function AdminSidebar() {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border bg-black">
                <div className="flex items-center gap-2 font-bold text-xl text-white">
                    <div className="bg-amber-500 p-1.5 rounded-lg text-black">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <span>book<span className="text-amber-500">.me</span></span>
                </div>
            </SidebarHeader>

            <SidebarContent className="bg-black">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-zinc-500">MVP MANAGEMENT</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {NAV_ITEMS.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title} className="text-zinc-300 hover:text-white hover:bg-zinc-900">
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

            <SidebarFooter className="border-t border-sidebar-border bg-black">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                        >
                            <LogOut />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset className="bg-zinc-950">
                <header className="flex h-16 shrink-0 items-center border-b border-zinc-900 px-6 sticky top-0 bg-black/80 backdrop-blur-sm z-50 justify-between">
                    <SidebarTrigger className="text-white" />
                    <div className="text-xs font-medium text-zinc-500 italic">
                        SECURE ADMIN PANEL
                    </div>
                </header>
                <main className="flex-1">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
```
