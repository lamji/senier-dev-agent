# Event Booking Template

## Overview
Full booking form with event type selection, date/time picker, client details, add-ons, availability verification, and submission. Follows strict MVVM pattern with URL parameter integration.

## MVVM Mapping

| File | Role | Description |
|------|------|-------------|
| `index.md` | **View** | Pure UI — renders the full booking form. Zero logic. |
| `useBooking.md` | **ViewModel** | All form state, validation, availability checking, URL params parsing, and booking submission. |
| `sub-components/` | **Fragments** | (Empty — form is within 300 line limit) |
| `sub-helpers/` | **Helpers** | (Empty — logic is within limit) |

## Dependencies
- `framer-motion` — Entrance animations
- `lucide-react` — CalendarDays, Clock, CheckCircle, XCircle, Send
- `date-fns` — Date formatting
- `@/lib/axios` — Centralized API client
- `@/types/booking` — CreateBookingPayload, EventType, CheckAvailabilityResponse, EVENT_TYPE_LABELS, ADD_ON_OPTIONS
- `next/navigation` — useSearchParams, useRouter
- Shadcn: Button, Card, Calendar, Checkbox, Input, Label, Popover, Select, Textarea, Badge

## Design Pattern
- Light background (bg-muted/30) for form contrast
- Card container with shadow for form grouping
- Grid layout (1-col mobile, 2-col desktop) for date/time and client details
- Gradient submit button (amber to orange)
- Color-coded feedback: emerald = success, red = error, amber = warning
- Motion entrance and result animations

## Router Integration
`app/booking/page.tsx` must be a **thin wrapper** with Suspense:
```tsx
import { Suspense } from "react";
import BookingPresentation from "@/presentations/Booking";

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingPresentation />
        </Suspense>
    );
}
```
> ⚠️ Suspense is REQUIRED because useBooking uses useSearchParams.

## URL Parameters
This booking page receives pre-filled data from the Hero section:
- `?date=2026-03-15T00:00:00.000Z` — Pre-selected date
- `?time=02:00 PM` — Pre-selected time

The ViewModel auto-parses and auto-verifies availability on mount.

## Key Rules
- View has NO useState, NO API calls, NO business logic
- ViewModel returns ALL state + handlers
- Final safety check: submit is blocked unless availability is confirmed
- Redirect home after 3 seconds on successful submission
- Max 300 lines per file
