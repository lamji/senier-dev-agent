# Professional Admin Table Standard

## Context: Event Management Registry
This component handles high-density data display for event bookings.

## File Version: 2026-02-20 (Approved Standard - Professional Static Regular v2)

```tsx
"use client";

import * as React from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
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
import {
    MoreHorizontal,
    ArrowUpDown,
    CircleCheck,
    CircleX,
    Eye,
    Copy,
    User
} from "lucide-react";
import { format } from "date-fns";
import type { IBooking, EventType } from "@/types/booking";
import { EVENT_TYPE_LABELS } from "@/types/booking";
import { BookingViewModal } from "./BookingViewModal";

const STATUS_CONFIG = {
    pending: { color: "bg-yellow-400", label: "Pending" },
    approved: { color: "bg-green-500", label: "Completed" },
    canceled: { color: "bg-red-500", label: "Canceled" },
};

interface BookingTableProps {
    data: IBooking[];
    onUpdateStatus: (id: string, status: "approved" | "canceled") => void;
    updatingId: string | null;
    hidePagination?: boolean;
}

export function BookingTable({ data, onUpdateStatus, updatingId, hidePagination = false }: BookingTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [viewedBooking, setViewedBooking] = React.useState<IBooking | null>(null);

    const columns: ColumnDef<IBooking>[] = [
        {
            accessorKey: "_id",
            header: "#",
            cell: ({ row }) => <span className="text-slate-500 text-xs font-medium">{row.index + 1}</span>,
        },
        {
            accessorKey: "eventType",
            header: ({ column }) => (
                <button
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-2 hover:text-slate-900 transition-colors"
                >
                    Event
                    <ArrowUpDown className="h-3 w-3" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="font-normal text-slate-800">
                    {EVENT_TYPE_LABELS[row.original.eventType as EventType] || row.original.eventType}
                </span>
            ),
        },
        {
            accessorKey: "clientName",
            header: "Assigned To",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-normal text-slate-800 leading-none">{row.original.clientName}</span>
                        <span className="text-[11px] text-slate-500">{row.original.clientEmail}</span>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const config = STATUS_CONFIG[row.original.status as keyof typeof STATUS_CONFIG] || { color: "bg-slate-300", label: row.original.status };
                return (
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${config.color}`} />
                        <span className="text-xs font-medium text-slate-700">{config.label}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "eventDate",
            header: "Due Date",
            cell: ({ row }) => (
                <span className="text-slate-600 font-medium text-xs">
                    {format(new Date(row.original.eventDate), "dd MMMM yyyy")}
                </span>
            ),
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => {
                const booking = row.original;
                const isPending = booking.status === "pending";

                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-[11px] font-normal text-slate-600 border-slate-200"
                            onClick={() => setViewedBooking(booking)}
                            data-test-id="admin-btn-view-booking"
                        >
                            View
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0 text-slate-400"
                                    data-test-id="admin-btn-more-actions"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border border-slate-200 shadow-xl">
                                <DropdownMenuLabel className="text-[10px] font-normal text-slate-400 uppercase p-3">Options</DropdownMenuLabel>
                                <DropdownMenuItem 
                                    onClick={() => navigator.clipboard.writeText(booking._id)}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy ID
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {isPending && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => onUpdateStatus(booking._id, "approved")}
                                            disabled={updatingId === booking._id}
                                        >
                                            <CircleCheck className="mr-2 h-4 w-4" />
                                            Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onUpdateStatus(booking._id, "canceled")}
                                            disabled={updatingId === booking._id}
                                            data-test-id="admin-item-cancel-booking"
                                        >
                                            <CircleX className="mr-2 h-4 w-4" />
                                            Cancel
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    });

    return (
        <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-slate-200">
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="h-12 text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6">
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="px-6 py-4">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-40 text-center text-slate-400 font-medium text-sm">
                                No records found in registry
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            {!hidePagination && (
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">
                        Showing {table.getRowModel().rows.length} of {data.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-md border-slate-200 text-slate-500 disabled:opacity-30"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            data-test-id="admin-btn-prev-page"
                        >
                            <span className="text-lg leading-none">‹</span>
                        </Button>
                        <div className="flex items-center gap-1">
                            <Button 
                                size="sm" 
                                className="h-8 w-8 rounded-md bg-blue-600 hover:bg-blue-600 text-white font-bold p-0 transition-none cursor-default"
                                data-test-id="admin-btn-page-1"
                            >
                                1
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-md border-slate-200 text-slate-500 disabled:opacity-30"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            data-test-id="admin-btn-next-page"
                        >
                            <span className="text-lg leading-none">›</span>
                        </Button>
                    </div>
                </div>
            )}

            <BookingViewModal
                booking={viewedBooking}
                isOpen={!!viewedBooking}
                onClose={() => setViewedBooking(null)}
                onUpdateStatus={onUpdateStatus}
                updatingId={updatingId}
            />
        </div>
    );
}
```
