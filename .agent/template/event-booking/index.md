# Event Booking — View (index.tsx)

> **Role**: Pure UI — renders the full booking form. All logic from `useBooking.ts`.
> **Location**: `presentations/Booking/index.tsx`

```tsx
"use client";

import { motion } from "framer-motion";
import { CalendarDays, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useBooking } from "./useBooking";
import {
    EVENT_TYPE_LABELS,
    ADD_ON_OPTIONS,
    type EventType,
} from "@/types/booking";

/**
 * BookingPresentation — THE VIEW for booking form
 *
 * Renders all form fields and delegates logic to useBooking ViewModel.
 */

const TIME_SLOTS = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM",
];

export default function BookingPresentation() {
    const vm = useBooking();

    return (
        <div className="min-h-screen bg-muted/30 py-16 px-6">
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Card className="border-border/40 shadow-xl">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl font-bold">
                                Book Your Event
                            </CardTitle>
                            <CardDescription>
                                Fill in the details below and we&apos;ll confirm your booking.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-4">
                            {/* Event Type */}
                            <div className="space-y-2">
                                <Label>Event Type *</Label>
                                <Select
                                    value={vm.eventType}
                                    onValueChange={(v) => vm.setEventType(v as EventType)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose event type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start"
                                            >
                                                <CalendarDays className="mr-2 h-4 w-4" />
                                                {vm.eventDate
                                                    ? format(vm.eventDate, "PPP")
                                                    : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={vm.eventDate}
                                                onSelect={vm.setEventDate}
                                                disabled={(date) => date < new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>Time *</Label>
                                    <Select
                                        value={vm.eventTime}
                                        onValueChange={vm.setEventTime}
                                    >
                                        <SelectTrigger>
                                            <Clock className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Pick a time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_SLOTS.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {t}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Check Availability */}
                            <Button
                                variant="outline"
                                onClick={() => vm.checkAvailability()}
                                disabled={
                                    !vm.eventDate ||
                                    !vm.eventTime ||
                                    vm.isCheckingAvailability
                                }
                                className="w-full"
                            >
                                {vm.isCheckingAvailability
                                    ? "Checking..."
                                    : "Check Availability"}
                            </Button>

                            {vm.availability && (
                                <div
                                    className={`flex items-center gap-2 rounded-lg p-3 text-sm ${vm.availability.available
                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                        : "bg-red-500/10 text-red-600 border border-red-500/20"
                                        }`}
                                >
                                    {vm.availability.available ? (
                                        <CheckCircle className="h-4 w-4" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    <span className="flex-1">{vm.availability.message}</span>
                                </div>
                            )}

                            {!vm.availability && (
                                <div className="bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg p-3 text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Please verify availability before submitting.</span>
                                </div>
                            )}

                            {/* Client Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name *</Label>
                                    <Input
                                        value={vm.clientName}
                                        onChange={(e) => vm.setClientName(e.target.value)}
                                        placeholder="Juan Dela Cruz"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email *</Label>
                                    <Input
                                        type="email"
                                        value={vm.clientEmail}
                                        onChange={(e) => vm.setClientEmail(e.target.value)}
                                        placeholder="juan@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Phone *</Label>
                                <Input
                                    value={vm.clientPhone}
                                    onChange={(e) => vm.setClientPhone(e.target.value)}
                                    placeholder="+63 912 345 6789"
                                />
                            </div>

                            {/* Add-ons */}
                            <div className="space-y-3">
                                <Label>Add-ons</Label>
                                <div className="flex flex-wrap gap-2">
                                    {ADD_ON_OPTIONS[vm.eventType].map((addOn) => (
                                        <label
                                            key={addOn}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <Checkbox
                                                checked={vm.addOns.includes(addOn)}
                                                onCheckedChange={() => vm.toggleAddOn(addOn)}
                                            />
                                            <Badge variant="outline" className="text-xs">
                                                {addOn}
                                            </Badge>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={vm.notes}
                                    onChange={(e) => vm.setNotes(e.target.value)}
                                    placeholder="Any special requests or details..."
                                    rows={3}
                                />
                            </div>

                            {/* Submit */}
                            <Button
                                onClick={vm.submitBooking}
                                disabled={vm.isSubmitting}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                {vm.isSubmitting ? "Submitting..." : "Submit Booking"}
                            </Button>

                            {/* Result */}
                            {vm.submitResult && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`flex items-center gap-2 rounded-lg p-3 text-sm ${vm.submitResult.success
                                        ? "bg-emerald-500/10 text-emerald-600"
                                        : "bg-red-500/10 text-red-600"
                                        }`}
                                >
                                    {vm.submitResult.success ? (
                                        <CheckCircle className="h-4 w-4" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    {vm.submitResult.message}
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
```
