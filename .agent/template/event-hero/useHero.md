# Event Hero — ViewModel (useHero.ts)

> **Role**: All homepage hero logic — date/time state, API calls, navigation.
> **Location**: `presentations/Home/useHome.ts`

```ts
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import type {
  CheckAvailabilityResponse,
} from "@/types/booking";

/**
 * useHome — ViewModel for the Homepage
 *
 * Manages hero date selection state, availability checking,
 * and navigation to the booking page with pre-filled data.
 * Pure logic, no JSX. (MVVM coding-standard.md)
 */

export function useHome() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<CheckAvailabilityResponse | null>(null);

  const checkAvailability = useCallback(async () => {
    if (!selectedDate || !selectedTime) return;

    setIsChecking(true);
    setAvailability(null);

    try {
      const res = await api.post("/api/bookings/availability", {
        eventDate: selectedDate.toISOString(),
        eventTime: selectedTime,
      });
      setAvailability(res.data);
    } catch {
      setAvailability({
        available: false,
        message: "Failed to check availability. Try again.",
      });
    } finally {
      setIsChecking(false);
    }
  }, [selectedDate, selectedTime]);

  const navigateToBooking = useCallback(() => {
    if (!selectedDate || !selectedTime) return;
    const params = new URLSearchParams({
      date: selectedDate.toISOString(),
      time: selectedTime,
    });
    router.push(`/booking?${params.toString()}`);
  }, [selectedDate, selectedTime, router]);

  return {
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    isChecking,
    availability,
    checkAvailability,
    navigateToBooking,
  };
}

export default useHome;
```
