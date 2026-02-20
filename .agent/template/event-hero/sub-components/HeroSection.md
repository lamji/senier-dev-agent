# Event Hero — Sub-Component (HeroSection.tsx)

> **Role**: View Fragment — the hero UI with glassmorphism date picker.
> **Location**: `presentations/Home/sub-components/HeroSection.tsx`
> **Consumes**: `useHome()` ViewModel hook

```tsx
"use client";

import { motion } from "framer-motion";
import { CalendarDays, Clock, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useHome } from "../useHome";

/**
 * HeroSection — Premium hero with glassmorphism date picker overlay
 *
 * Uses Unsplash image as background per MVP protocol.
 */

const TIME_SLOTS = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM",
];

export default function HeroSection() {
    const {
        selectedDate,
        setSelectedDate,
        selectedTime,
        setSelectedTime,
        isChecking,
        availability,
        checkAvailability,
        navigateToBooking,
    } = useHome();

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage:
                        "url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80)",
                }}
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/60" />

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Badge
                        variant="secondary"
                        className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm gap-1.5"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        Premium Event Services
                    </Badge>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
                        Unforgettable
                        <span className="block bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                            Moments Await
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
                        From dream weddings to electrifying band performances — we bring
                        your vision to life with precision and passion.
                    </p>
                </motion.div>

                {/* Glassmorphism Booking Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                >
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        {/* Date Picker */}
                        <div className="flex-1 w-full">
                            <label className="text-sm text-white/60 mb-2 block text-left">
                                Select Date
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    >
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        {selectedDate
                                            ? format(selectedDate, "PPP")
                                            : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        disabled={(date) => date < new Date()}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Time Picker */}
                        <div className="flex-1 w-full">
                            <label className="text-sm text-white/60 mb-2 block text-left">
                                Select Time
                            </label>
                            <Select value={selectedTime} onValueChange={setSelectedTime}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <Clock className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Pick a time" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_SLOTS.map((time) => (
                                        <SelectItem key={time} value={time}>
                                            {time}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Check Button */}
                        <Button
                            onClick={checkAvailability}
                            disabled={!selectedDate || !selectedTime || isChecking}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8"
                        >
                            {isChecking ? "Checking..." : "Check Availability"}
                        </Button>
                    </div>

                    {/* Availability Result */}
                    {availability && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-4"
                        >
                            <div
                                className={`flex items-center gap-2 rounded-lg p-3 text-sm ${availability.available
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-red-500/20 text-red-300"
                                    }`}
                            >
                                {availability.available ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : (
                                    <XCircle className="h-4 w-4" />
                                )}
                                <span className="flex-1 text-left">{availability.message}</span>
                                {availability.available && (
                                    <Button
                                        size="sm"
                                        onClick={navigateToBooking}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4"
                                    >
                                        Book Now
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
```
