# Event Booking — ViewModel (useBooking.ts)

> **Role**: All booking form logic — state, validation, URL params, API calls, submission.
> **Location**: `presentations/Booking/useBooking.ts`

```ts
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import type {
  CreateBookingPayload,
  EventType,
  CheckAvailabilityResponse,
} from "@/types/booking";

/**
 * useBooking — ViewModel for the Booking form
 *
 * Handles form state, validation, availability check, and submission.
 * Now extracts date/time from URL and re-verifies on mount.
 */

export function useBooking() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasAutoChecked = useRef(false);

  // Form fields
  const [eventType, setEventType] = useState<EventType>("wedding");
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [eventTime, setEventTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [addOns, setAddOns] = useState<string[]>([]);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availability, setAvailability] = useState<CheckAvailabilityResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  // Parse URL Params on mount
  useEffect(() => {
    if (!searchParams) return;
    const d = searchParams.get("date");
    const t = searchParams.get("time");

    if (d && t) {
      const parsedDate = new Date(d);
      if (!isNaN(parsedDate.getTime())) {
        setEventDate(parsedDate);
        setEventTime(t);
      }
    }
  }, [searchParams]);

  const toggleAddOn = useCallback((addOn: string) => {
    setAddOns((prev) =>
      prev.includes(addOn)
        ? prev.filter((a) => a !== addOn)
        : [...prev, addOn]
    );
  }, []);

  const checkAvailability = useCallback(async (overrideDate?: Date, overrideTime?: string) => {
    const d = overrideDate || eventDate;
    const t = overrideTime || eventTime;

    if (!d || !t) return;

    setIsCheckingAvailability(true);
    setAvailability(null);

    try {
      const res = await api.post("/api/bookings/availability", {
        eventDate: d.toISOString(),
        eventTime: t,
      });
      setAvailability(res.data);
      return res.data as CheckAvailabilityResponse;
    } catch {
      setAvailability({
        available: false,
        message: "Failed to check. Try again.",
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [eventDate, eventTime]);

  // Auto-check on mount if we have params
  useEffect(() => {
    if (!searchParams) return;
    const d = searchParams.get("date");
    const t = searchParams.get("time");

    if (d && t && !hasAutoChecked.current) {
      hasAutoChecked.current = true;
      const parsedDate = new Date(d);
      if (!isNaN(parsedDate.getTime())) {
        checkAvailability(parsedDate, t);
      }
    }
  }, [searchParams, checkAvailability]);

  const submitBooking = useCallback(async () => {
    // Final safety check: must be available
    if (!availability?.available) {
      setSubmitResult({
        success: false,
        message: "Please select an available date and time first.",
      });
      return;
    }

    if (!eventDate || !eventTime || !clientName || !clientEmail || !clientPhone) {
      setSubmitResult({
        success: false,
        message: "Please fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const payload: CreateBookingPayload = {
        eventType,
        eventDate: eventDate.toISOString(),
        eventTime,
        clientName,
        clientEmail,
        clientPhone,
        notes,
        addOns,
      };

      await api.post("/api/bookings", payload);

      setSubmitResult({
        success: true,
        message: "Booking submitted! We'll get back to you shortly.",
      });

      // Redirect home after 3 seconds on success
      setTimeout(() => router.push("/"), 3000);

    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setSubmitResult({
        success: false,
        message: err?.response?.data?.error || "Submission failed. Try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [eventType, eventDate, eventTime, clientName, clientEmail, clientPhone, notes, addOns, availability, router]);

  return {
    eventType, setEventType,
    eventDate, setEventDate,
    eventTime, setEventTime,
    clientName, setClientName,
    clientEmail, setClientEmail,
    clientPhone, setClientPhone,
    notes, setNotes,
    addOns, toggleAddOn,
    isSubmitting,
    isCheckingAvailability,
    availability,
    submitResult,
    checkAvailability,
    submitBooking,
  };
}

export default useBooking;
```
