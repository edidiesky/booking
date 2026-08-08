import { useState, useEffect, useCallback, useRef } from "react";
import { useLazyGetAdminBookingsInRangeQuery } from "@/redux/services/adminApi";
import type { Booking } from "@/types/api";

interface Params {
  windowStart:   Date;
  chunkSizeDays: number;
  capDays:       number;
}

export function useAdminIncrementalBookingWindow({ windowStart, chunkSizeDays, capDays }: Params) {
  const [loadedDays, setLoadedDays] = useState(chunkSizeDays);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchRange] = useLazyGetAdminBookingsInRangeQuery();
  const fetchedUpTo = useRef(0);

  const windowStartKey = windowStart.toISOString().slice(0, 10);

  useEffect(() => {
    setLoadedDays(chunkSizeDays);
    setBookings([]);
    fetchedUpTo.current = 0;
  }, [windowStartKey, chunkSizeDays]);

  const loadChunk = useCallback(async (fromDay: number, toDay: number) => {
    const from = new Date(windowStart); from.setDate(from.getDate() + fromDay);
    const to   = new Date(windowStart); to.setDate(to.getDate() + toDay);
    const result = await fetchRange({ from: from.toISOString(), to: to.toISOString() }).unwrap().catch(() => ({ data: [] as Booking[] }));
    setBookings((prev) => {
      const seen = new Set(prev.map((b) => b.bookingId));
      return [...prev, ...result.data.filter((b) => !seen.has(b.bookingId))];
    });
  }, [windowStart, fetchRange]);

  useEffect(() => {
    if (fetchedUpTo.current >= loadedDays) return;
    void loadChunk(fetchedUpTo.current, loadedDays).then(() => { fetchedUpTo.current = loadedDays; });
  }, [loadedDays, loadChunk]);

  const reachedCap = loadedDays >= capDays;

  const loadMore = useCallback(() => {
    if (loadingMore || reachedCap) return;
    setLoadingMore(true);
    const nextLoadedDays = Math.min(capDays, loadedDays + chunkSizeDays);
    void loadChunk(loadedDays, nextLoadedDays).then(() => {
      fetchedUpTo.current = nextLoadedDays;
      setLoadedDays(nextLoadedDays);
      setLoadingMore(false);
    });
  }, [loadingMore, reachedCap, capDays, loadedDays, chunkSizeDays, loadChunk]);

  return { bookings, loadedDays, loadingMore, reachedCap, loadMore };
}