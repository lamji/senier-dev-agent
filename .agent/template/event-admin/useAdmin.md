# Professional Admin ViewModel Standard

```ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocket } from "@/lib/hooks/useSocket";
import api from "@/lib/axios";
import type { IBooking } from "@/types/booking";

export function useAdmin() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const { socket, emit } = useSocket();
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
      console.error("[Admin] Failed to fetch bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (!socket) return;
    
    socket.emit("join-admin");

    const onNewBooking = (bookingData: unknown) => {
      fetchBookings();
    };

    const onBookingUpdate = (updateData: unknown) => {
      fetchBookings();
    };

    socket.on("new-booking", onNewBooking);
    socket.on("booking-update", onBookingUpdate);

    return () => {
      socket.off("new-booking", onNewBooking);
      socket.off("booking-update", onBookingUpdate);
    };
  }, [socket, fetchBookings]);

  const updateStatus = useCallback(
    async (id: string, status: "approved" | "canceled") => {
      setUpdatingId(id);
      try {
        await api.patch(`/api/bookings/${id}`, { status });
        emit("booking-update", { id, status });
        setBookings((prev) =>
          prev.map((b) => (b._id === id ? { ...b, status } : b))
        );
      } catch (error) {
        console.error("[Admin] Failed to update booking:", error);
      } finally {
        setUpdatingId(null);
      }
    },
    [emit]
  );

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
