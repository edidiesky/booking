import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetPropertiesQuery } from "@/redux/services/propertyApi";
import { useDebounce } from "@/hooks/useDebounce";

const DEFAULT_CITY = "Lagos";
export function useSearch() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const propertyType = searchParams.get("propertyType") ?? "";
  const city = searchParams.get("city") ?? DEFAULT_CITY;
  const minPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : undefined;
  const guests = searchParams.get("guests")
    ? Number(searchParams.get("guests"))
    : undefined;
  const sort = searchParams.get("sort") ?? "newest";
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

  const setParam = useCallback(
    (key: string, value: string | number | undefined, resetPage = true) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === undefined || value === "") next.delete(key);
        else next.set(key, String(value));
        if (resetPage) next.delete("page");
        return next;
      });
    },
    [setSearchParams],
  );

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useGetPropertiesQuery({
    search: debouncedSearch,
    propertyType,
    city,
    minPrice,
    maxPrice,
    guests,
    sort,
    page,
    limit: 20,
  });

  return {
    properties: data?.data ?? [],
    isLoading: isLoading || isFetching,
    search,
    setSearch: (v: string) => setParam("q", v),
    propertyType,
    setPropertyType: (v: string) => setParam("propertyType", v),
    city,
    setCity: (v: string) => setParam("city", v),
    minPrice,
    setMinPrice: (v: number | undefined) => setParam("minPrice", v),
    maxPrice,
    setMaxPrice: (v: number | undefined) => setParam("maxPrice", v),
    guests,
    setGuests: (v: number | undefined) => setParam("guests", v),
    sort,
    setSort: (v: string) => setParam("sort", v, false),
    page,
    setPage: (v: number) => setParam("page", v, false),
    isDefaultCity: !searchParams.get("city"),
  };
}
