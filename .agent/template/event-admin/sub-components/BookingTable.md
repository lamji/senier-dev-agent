# Event Admin — Booking Table (BookingTable.md)

> **Role**: TanStack Table implementation for list management.
> **Location**: `presentations/Admin/sub-components/BookingTable.tsx`

```tsx
"use client";

import * as React from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown, CircleCheck, CircleX } from "lucide-react";
import { format } from "date-fns";
import type { IBooking, EventType } from "@/types/booking";

/**
 * BookingTable — Scalable Table UI
 * Uses TanStack for state and Shadcn Table for UI.
 */

export function BookingTable({ data, onUpdateStatus, updatingId }) {
    // Columns definition following MVVM isolation
    const columns: ColumnDef<IBooking>[] = [
        /* ... column definitions (refer to full source) ... */
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="w-full">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-900">
                        {/* Header rows */}
                    </TableHeader>
                    <TableBody>
                        {/* Data rows */}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination Controls */}
        </div>
    );
}
```
