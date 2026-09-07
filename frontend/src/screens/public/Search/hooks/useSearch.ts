import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetPropertiesQuery } from "@/redux/services/propertyApi";
import { useDebounce } from "@/hooks/useDebounce";
import type { PlaceType, SearchFiltersState } from "../components/FiltersModal";

export function useSearch() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const propertyType = searchParams.get("propertyType") ?? "";
  const placeType = (searchParams.get("placeType") as PlaceType) || "any";
  const city = searchParams.get("city") ?? "";
  const minPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : undefined;
  const guests = searchParams.get("guests")
    ? Number(searchParams.get("guests"))
    : undefined;
  const bedrooms = searchParams.get("bedrooms")
    ? Number(searchParams.get("bedrooms"))
    : undefined;
  const beds = searchParams.get("beds")
    ? Number(searchParams.get("beds"))
    : undefined;
  const bathrooms = searchParams.get("bathrooms")
    ? Number(searchParams.get("bathrooms"))
    : undefined;
  const amenities =
    searchParams.get("amenities")?.split(",").filter(Boolean) ?? [];
  const neighborhoods =
    searchParams.get("neighborhoods")?.split(",").filter(Boolean) ?? [];
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

  const effectivePropertyType =
    propertyType || (placeType !== "any" ? placeType : undefined);

  const { data, isLoading, isFetching } = useGetPropertiesQuery({
    search: debouncedSearch || undefined,
    propertyType: effectivePropertyType || undefined,
    city: city || undefined,
    minPrice,
    maxPrice,
    guests,
    sort,
    page,
    limit: 24,
    bedrooms,
    beds,
    bathrooms,
    amenities: amenities.length ? amenities.join(",") : undefined,
  });

  const filtersState: SearchFiltersState = {
    placeType,
    minPrice,
    maxPrice,
    bedrooms,
    beds,
    bathrooms,
    amenities,
    neighborhoods,
  };

  const applyFilters = useCallback(
    (next: SearchFiltersState) => {
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        const setOrDel = (k: string, v: string | number | undefined) => {
          if (v === undefined || v === "" || v === "any") p.delete(k);
          else p.set(k, String(v));
        };
        setOrDel(
          "placeType",
          next.placeType === "any" ? undefined : next.placeType,
        );
        if (next.placeType && next.placeType !== "any") {
          p.set("propertyType", next.placeType);
        }
        setOrDel("minPrice", next.minPrice);
        setOrDel("maxPrice", next.maxPrice);
        setOrDel("bedrooms", next.bedrooms);
        setOrDel("beds", next.beds);
        setOrDel("bathrooms", next.bathrooms);
        setOrDel(
          "amenities",
          next.amenities.length ? next.amenities.join(",") : undefined,
        );
        setOrDel(
          "neighborhoods",
          next.neighborhoods.length ? next.neighborhoods.join(",") : undefined,
        );
        p.delete("page");
        return p;
      });
    },
    [setSearchParams],
  );

  const activeFilterCount =
    (placeType !== "any" ? 1 : 0) +
    (minPrice != null ? 1 : 0) +
    (maxPrice != null ? 1 : 0) +
    (bedrooms != null ? 1 : 0) +
    (beds != null ? 1 : 0) +
    (bathrooms != null ? 1 : 0) +
    amenities.length +
    neighborhoods.length +
    (city ? 1 : 0);

  return {
    properties: data?.data ?? [],
    isLoading: isLoading || isFetching,
    search,
    setSearch: (v: string) => setParam("q", v),
    propertyType,
    setPropertyType: (v: string) => setParam("propertyType", v || undefined),
    city,
    setCity: (v: string) => setParam("city", v || undefined),
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
    isDefaultCity: !city,
    filtersState,
    applyFilters,
    activeFilterCount,
  };
}