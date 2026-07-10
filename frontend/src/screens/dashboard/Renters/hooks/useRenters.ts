import { useState } from "react";
import { useGetRentersQuery } from "@/redux/services/renterApi";

export function useRenters() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetRentersQuery();

  const all = data?.data.renters ?? [];
  const filtered = all.filter((r) =>
    !search || r.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return { renters: filtered, stats: data?.data.stats, isLoading, search, setSearch };
}

