# Event Admin — View (index.tsx)

> **Role**: Admin Dashboard — renders metrics and booking table.
> **Location**: `presentations/Admin/index.tsx`

```tsx
"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "./useAdmin";
import { BookingTable } from "./sub-components/BookingTable";

/**
 * AdminPresentation — THE VIEW for admin dashboard
 *
 * Renders booking list using TanStack Table with filter tabs and actions.
 * USES DIV INSTEAD OF CARD PER CODING STANDARDS.
 */

export default function AdminPresentation() {
    const vm = useAdmin();

    return (
        <div className="py-10 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                        <p className="text-sm text-zinc-400">
                            Real-time analytics and booking management.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={vm.fetchBookings}
                        disabled={vm.isLoading}
                        className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white"
                    >
                        <RefreshCw
                            className={`mr-2 h-4 w-4 ${vm.isLoading ? "animate-spin" : ""}`}
                        />
                        Sync Data
                    </Button>
                </div>

                {/* Analytics Metrics (Native Divs instead of Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 backdrop-blur-sm">
                        <p className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider mb-2">Pending</p>
                        <div className="text-3xl font-bold text-white">{vm.pendingCount}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-sm">
                        <p className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider mb-2">Approved</p>
                        <div className="text-3xl font-bold text-white">{vm.approvedCount}</div>
                    </div>
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-sm">
                        <p className="text-xs font-semibold text-red-500/80 uppercase tracking-wider mb-2">Canceled</p>
                        <div className="text-3xl font-bold text-white">{vm.canceledCount}</div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <Tabs value={vm.filter} onValueChange={vm.setFilter} className="mb-6">
                    <TabsList className="bg-zinc-900 border border-zinc-800">
                        <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800">All</TabsTrigger>
                        <TabsTrigger value="pending" className="data-[state=active]:bg-amber-500/20 text-amber-500/80">Pending</TabsTrigger>
                        <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-500/20 text-emerald-500/80">Approved</TabsTrigger>
                        <TabsTrigger value="canceled" className="data-[state=active]:bg-red-500/20 text-red-500/80">Canceled</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Table Section */}
                {vm.isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full bg-zinc-900" />
                        <Skeleton className="h-40 w-full bg-zinc-900" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <BookingTable
                            data={vm.bookings}
                            onUpdateStatus={vm.updateStatus}
                            updatingId={vm.updatingId}
                        />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
```
