import { useState } from "react";
import { useGetPropertiesQuery } from "@/redux/services/propertyApi";
import { useDebounce } from "@/hooks/useDebounce";

export function useSearch() {
  const [search, setSearch]             = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [city, setCity]                 = useState("");
  const [minPrice, setMinPrice]         = useState<number>();
  const [maxPrice, setMaxPrice]         = useState<number>();
  const [guests, setGuests]             = useState<number>();
  const [sort, setSort]                 = useState("newest");
  const [page, setPage]                 = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useGetPropertiesQuery({
    search: debouncedSearch, propertyType, city, minPrice, maxPrice, guests, sort, page, limit: 20,
  });

  return {
    properties: data?.data ?? [],
    isLoading: isLoading || isFetching,
    search, setSearch,
    propertyType, setPropertyType,
    city, setCity,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    guests, setGuests,
    sort, setSort,
    page, setPage,
  };
}