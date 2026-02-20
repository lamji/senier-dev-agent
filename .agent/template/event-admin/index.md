# Professional Admin View (Multi-View Standard)

This component implements a state-driven view switcher for the Admin Panel.

## File Version: 2026-02-20 (Refined Analytics - Minimalist Header)

```tsx
"use client";

import { useAdminContext } from "./AdminProvider";
import { BookingTable } from "./sub-components/BookingTable";
import {
    Users,
    CalendarCheck,
    CreditCard,
    TrendingUp,
    Filter,
    FileDown,
    Plus,
    LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPHP } from "@/lib/format";

export default function AdminPresentation() {
    const {
        bookings,
        updateStatus,
        updatingId,
        pendingCount,
        approvedCount,
        currentView
    } = useAdminContext();

    // DASHBOARD VIEW (Analytics + 5 Recent)
    if (currentView === "DASHBOARD") {
        const stats = [
            { label: "Total Bookings", value: bookings.length, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Pending Approval", value: pendingCount, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Completed Events", value: approvedCount, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Revenue Stream", value: formatPHP(approvedCount * 1500), icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50" },
        ];

        return (
            <div className="space-y-10 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                        <p className="text-sm text-slate-500 font-medium">Daily analytics and recent activity overview.</p>
                    </div>

                    <div className="flex items-center gap-3">
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
                            <div className={`h-12 w-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">Recent 5 Bookings</h2>
                        <span className="text-xs font-medium text-slate-400">Registry Snapshot</span>
                    </div>

                    <BookingTable
                        data={bookings.slice(0, 5)}
                        onUpdateStatus={updateStatus}
                        updatingId={updatingId}
                        hidePagination={true}
                    />
                </div>
            </div>
        );
    }

    // REGISTRY / BOOKINGS VIEW (Full List)
    if (currentView === "BOOKINGS") {
        return (
            <div className="space-y-10 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bookings Registry</h1>
                        <p className="text-sm text-slate-500 font-medium">The complete ledger of all event registrations.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-10 gap-2 font-semibold text-slate-600 border-slate-200">
                            <Filter className="h-4 w-4" />
                            Filters
                        </Button>
                        <Button variant="outline" className="h-10 gap-2 font-semibold text-slate-600 border-slate-200">
                            <FileDown className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">Master Record</h2>
                        <span className="text-xs font-medium text-slate-400">Total Entries: {bookings.length}</span>
                    </div>

                    <BookingTable
                        data={bookings}
                        onUpdateStatus={updateStatus}
                        updatingId={updatingId}
                    />
                </div>
            </div>
        );
    }

    // FALLBACK / OTHER VIEWS
    return (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                <LayoutDashboard className="h-8 w-8" />
            </div>
            <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">{currentView} Module</h2>
                <p className="text-sm text-slate-500">This professional module is currently being synchronized.</p>
            </div>
        </div>
    );
}
```
