import { useState } from "react";
import { useListGuestsQuery } from "@/redux/services/adminApi";
import { useGetPlatformStatsQuery } from "@/redux/services/adminApi";
import { AdminGuestSummary } from "@/types/api";

export function useAdminCustomers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
const [selectedGuest, setSelectedGuest] = useState<AdminGuestSummary | null>(null);
  const { data, isLoading, isFetching } = useListGuestsQuery({ page });
  const { data: statsData } = useGetPlatformStatsQuery();

  const allGuests = data?.data.guests ?? [];
  const guests = search
    ? allGuests.filter((g) =>
        `${g.firstName} ${g.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase()),
      )
    : allGuests;

  return {
    guests, isLoading, isFetching,
    page, setPage,
    totalPages: data?.data.totalPages ?? 1,
    search, setSearch,
    selectedGuest, setSelectedGuest,
    stats: statsData?.data.guestBreakdown,
  };
}