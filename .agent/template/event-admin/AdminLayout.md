# Professional Admin Layout Standard

```tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
    LayoutDashboard, 
    Calendar, 
    Users, 
    LogOut, 
    Bell, 
    Search,
    PlusCircle,
    Package,
    MessageSquare,
    ClipboardList,
    Briefcase
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const menuItems = [
        { group: "General", items: [
            { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
            { icon: Users, label: "Customers", href: "/admin" },
        ]},
        { group: "Work", items: [
            { icon: ClipboardList, label: "Bookings", href: "/admin" },
            { icon: Briefcase, label: "Projects", href: "/admin" },
            { icon: Package, label: "Add-ons", href: "/admin" },
        ]},
        { group: "Engagement", items: [
            { icon: MessageSquare, label: "Messages", href: "/admin" },
            { icon: Bell, label: "Notices", href: "/admin" },
            { icon: Calendar, label: "Events", href: "/admin" },
        ]},
    ];

    return (
        <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
            <aside className="w-[260px] bg-[#1e293b] text-slate-300 flex flex-col fixed h-full z-50">
                <div className="p-6 flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
                        <span className="font-bold text-white text-lg">B</span>
                    </div>
                    <span className="font-bold text-white text-xl tracking-tight">BOOK.ME</span>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                    {menuItems.map((group) => (
                        <div key={group.group} className="space-y-2">
                            <h3 className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {group.group}
                            </h3>
                            <nav className="space-y-1">
                                {group.items.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white ${
                                            pathname === item.href && item.label === "Dashboard" ? "bg-slate-800 text-white" : ""
                                        }`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-800">
                    <button 
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            <div className="flex-1 ml-[260px] flex flex-col">
                <header className="h-[70px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search everything..." 
                                className="pl-10 h-10 bg-slate-50 border-none shadow-none focus-visible:ring-1 focus-visible:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 rounded-full">
                            <PlusCircle className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 rounded-full">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <div className="h-4 w-[1px] bg-slate-200 mx-2" />
                        <div className="flex items-center gap-3 pl-2">
                             <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold leading-none">Admin User</p>
                                <p className="text-[10px] text-slate-500 font-medium">Administrator</p>
                             </div>
                             <div className="h-9 w-9 rounded-full bg-slate-200" />
                        </div>
                    </div>
                </header>

                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
```
