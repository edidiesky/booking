import { useState }                from "react";
import { useGetPropertiesQuery }   from "@/redux/services/propertyApi";
import { useDebounce }             from "@/hooks/useDebounce";
import type { PropertyType }       from "@/types/api";

export function useProperties() {
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState<PropertyType | "">("");

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading, isFetching } = useGetPropertiesQuery({
    page,
    limit: 12,
  });

  const allProperties = data?.data ?? [];

  const filtered = allProperties.filter((p) => {
    const matchesSearch = !debouncedSearch ||
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.address.city.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesType = !typeFilter || p.propertyType === typeFilter;
    return matchesSearch && matchesType;
  });

  return {
    properties:  filtered,
    allCount:    allProperties.length,
    isLoading,
    isFetching,
    search,      setSearch,
    typeFilter,  setTypeFilter,
    page,        setPage,
  };
}