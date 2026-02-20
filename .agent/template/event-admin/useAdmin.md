# Event Admin — ViewModel (useAdmin.ts)

> **Role**: Admin logic — data fetching, status updates, and metrics calculation.
> **Location**: `presentations/Admin/useAdmin.ts`

```ts
"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import type { IBooking } from "@/types/booking";

/**
 * useAdmin — ViewModel for Admin Dashboard
 *
 * Handles fetching bookings, updating status, and calculating analytics.
 * Pure logic, no JSX. (MVVM coding-standard.md)
 */

export function useAdmin() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      if (filter !== "all") params.status = filter;

      const res = await api.get("/api/bookings", { params });
      setBookings(res.data.bookings);
    } catch (error) {
      console.error("[Admin] VM Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = useCallback(
    async (id: string, status: "approved" | "canceled") => {
      setUpdatingId(id);
      try {
        await api.patch(`/api/bookings/${id}`, { status });

        // Optimistic update for responsiveness
        setBookings((prev) =>
          prev.map((b) => (b._id === id ? { ...b, status } : b))
        );
      } catch (error) {
        console.error("[Admin] Status Update Error:", error);
      } finally {
        setUpdatingId(null);
      }
    },
    []
  );

  // Analytical Metrics for Dashboard
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const approvedCount = bookings.filter((b) => b.status === "approved").length;
  const canceledCount = bookings.filter((b) => b.status === "canceled").length;

  return {
    bookings,
    isLoading,
    filter,
    setFilter,
    updatingId,
    updateStatus,
    fetchBookings,
    pendingCount,
    approvedCount,
    canceledCount,
  };
}

export default useAdmin;
```
