# Professional Admin View Modal (Premium Detail Standard)

This component implements a high-density, centralized detail view for event bookings, featuring integrated MVP workflow actions.

## File Version: 2026-02-20 (Approved Standard - Integrated MVP Actions)

```tsx
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { IBooking, EventType } from "@/types/booking";
import { EVENT_TYPE_LABELS } from "@/types/booking";
import {
    Copy,
    Mail,
    Phone,
    Calendar,
    Clock,
    User,
    ClipboardList,
    BadgeCheck,
    Hash
} from "lucide-react";
import { formatPHP } from "@/lib/format";

interface BookingViewModalProps {
    booking: IBooking | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (id: string, status: "approved" | "canceled") => void;
    updatingId: string | null;
}

const STATUS_CONFIG = {
    pending: { color: "bg-yellow-400", text: "text-amber-700", bg: "bg-amber-50", label: "Pending Review" },
    approved: { color: "bg-green-500", text: "text-emerald-700", bg: "bg-emerald-50", label: "Completed" },
    canceled: { color: "bg-red-500", text: "text-rose-700", bg: "bg-rose-50", label: "Canceled" },
};

export function BookingViewModal({ booking, isOpen, onClose, onUpdateStatus, updatingId }: BookingViewModalProps) {
    if (!booking) return null;

    const status = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] || {
        color: "bg-slate-300",
        text: "text-slate-700",
        bg: "bg-slate-50",
        label: booking.status
    };

    const DataRow = ({ label, value, icon: Icon }: { label: string; value: string | React.ReactNode; icon: any }) => (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors px-1">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-sm font-bold text-slate-900">{value}</div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl"
                data-test-id="admin-modal-booking-details"
            >
                <div className="bg-slate-900 p-8 text-white relative">
                    <div className="absolute top-8 right-8">
                        <div className={`px-4 py-1.5 rounded-full ${status.bg} ${status.text} text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${status.color}`} />
                            {status.label}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                            <BadgeCheck className="h-4 w-4" />
                            Registry Entry
                        </div>
                        <DialogTitle className="text-3xl font-black tracking-tight leading-none">
                            {EVENT_TYPE_LABELS[booking.eventType as EventType] || booking.eventType}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs font-medium flex items-center gap-2 mt-2">
                            <Hash className="h-3 w-3" />
                            Reference ID: <span className="text-slate-300 select-all font-mono">{booking._id}</span>
                            <button
                                onClick={() => navigator.clipboard.writeText(booking._id)}
                                className="hover:text-white transition-colors p-1"
                                data-test-id="admin-btn-copy-id"
                            >
                                <Copy className="h-3 w-3" />
                            </button>
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Customer Section */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <User className="h-3 w-3" />
                            Customer Identification
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</p>
                                <p className="text-sm font-black text-slate-900 uppercase">{booking.clientName}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 overflow-hidden">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Email</p>
                                <a href={`mailto:${booking.clientEmail}`} className="text-sm font-bold text-blue-600 truncate block hover:underline">
                                    {booking.clientEmail}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Section */}
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Calendar className="h-3 w-3" />
                            Event Specification
                        </h3>
                        <div className="rounded-xl border border-slate-100 overflow-hidden px-4">
                            <DataRow
                                label="Scheduled Date"
                                value={format(new Date(booking.eventDate), "MMMM dd, yyyy")}
                                icon={Calendar}
                            />
                            <DataRow
                                label="Time Window"
                                value={booking.eventTime}
                                icon={Clock}
                            />
                            <DataRow
                                label="Project Value"
                                value={formatPHP(1500)} // Placeholder standardized rate
                                icon={ClipboardList}
                            />
                        </div>
                    </div>

                    {/* Add-ons/Notes */}
                    {(booking.addOns?.length || booking.notes) && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                            {booking.addOns?.length && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Selected Add-ons</p>
                                    <div className="flex flex-wrap gap-2">
                                        {booking.addOns.map(add => (
                                            <span key={add} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-600 uppercase">
                                                {add}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {booking.notes && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Internal Specification Notes</p>
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium italic select-all">
                                        &ldquo;{booking.notes}&rdquo;
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center sm:justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Created: {format(new Date(booking.createdAt), "MM/dd/yy p")}
                    </span>
                    <div className="flex gap-2">
                        {booking.status === "pending" ? (
                            <>
                                <Button
                                    className="h-10 px-6 font-normal bg-red-600 text-white"
                                    onClick={() => onUpdateStatus(booking._id, "canceled")}
                                    disabled={updatingId === booking._id}
                                    data-test-id="admin-btn-modal-cancel"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="h-10 px-8 font-normal bg-slate-900 text-white"
                                    onClick={() => onUpdateStatus(booking._id, "approved")}
                                    disabled={updatingId === booking._id}
                                    data-test-id="admin-btn-modal-approve"
                                >
                                    Approve
                                </Button>
                            </>
                        ) : (
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 px-6 font-normal text-slate-600 border-slate-200"
                                    data-test-id="admin-btn-modal-close"
                                >
                                    Close
                                </Button>
                            </DialogClose>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```
