import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import Header from "@/components/common/Header";
import PropertyCard from "@/components/common/PropertyCard";
import CardLoader from "@/components/common/loader/CardLoader";
import { useSearch } from "./hooks/useSearch";
import FiltersModal from "./components/FiltersModal";
import SearchFilterBar, {
  type SearchBarFilters,
} from "./components/SearchFilterBar";
import SearchMap from "./components/SearchMap";
import { useListFavoritedIdsQuery } from "@/redux/services/favoriteApi";
import { selectAccessToken } from "@/redux/slices/authSlice";
import type { PropertyWithRoomTypes } from "@/types/api";

export default function SearchPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const {
    properties,
    isLoading,
    city,
    propertyType,
    setPropertyType,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    guests,
    setGuests,
    filtersState,
    applyFilters,
    activeFilterCount,
  } = useSearch();

  const [bar, setBar] = useState<SearchBarFilters>(() => ({
    minPrice,
    maxPrice,
    guests,
    bedrooms: filtersState.bedrooms,
    bathrooms: filtersState.bathrooms,
    propertyType: propertyType || undefined,
  }));

  const token = useSelector(selectAccessToken);
  const ids = properties.map((p: PropertyWithRoomTypes) => p.id);
  const { data: favoritedData } = useListFavoritedIdsQuery(ids, {
    skip: !token || ids.length === 0,
  });
  const favoritedSet = useMemo(
    () => new Set(favoritedData?.data ?? []),
    [favoritedData],
  );

  const commitBar = () => {
    setMinPrice(bar.minPrice);
    setMaxPrice(bar.maxPrice);
    setGuests(bar.guests);
    setPropertyType(bar.propertyType ?? "");
    applyFilters({
      ...filtersState,
      bedrooms: bar.bedrooms,
      bathrooms: bar.bathrooms,
      minPrice: bar.minPrice,
      maxPrice: bar.maxPrice,
    });
  };

  const resetBar = () => {
    setBar({});
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setGuests(undefined);
    setPropertyType("");
    applyFilters({
      placeType: "any",
      amenities: [],
      neighborhoods: [],
      bedrooms: undefined,
      beds: undefined,
      bathrooms: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    });
  };

  const moreCount =
    filtersState.amenities.length +
    filtersState.neighborhoods.length +
    (filtersState.beds != null ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex min-h-screen flex-col bg-white"
    >
      <Header />

      <SearchFilterBar
        value={bar}
        onChange={setBar}
        onApply={commitBar}
        onReset={resetBar}
        onOpenMoreFilters={() => setFiltersOpen(true)}
        activeMoreCount={moreCount + activeFilterCount}
      />

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filtersState}
        onApply={(next) => {
          applyFilters(next);
          setBar((b) => ({
            ...b,
            bedrooms: next.bedrooms,
            bathrooms: next.bathrooms,
            minPrice: next.minPrice,
            maxPrice: next.maxPrice,
            propertyType:
              next.placeType !== "any" ? next.placeType : b.propertyType,
          }));
        }}
        resultCount={properties.length || undefined}
      />

      <div className="mx-auto pt-8 w-full max-w-screen-2xl flex-1">
        <div className="grid min-h-[calc(100vh-140px)] grid-cols-1 lg:grid-cols-2">
          <div className="max-h-[calc(100vh-140px)] overflow-y-auto px-4 py-6 lg:px-6 lg:py-8">
            <div className="mb-5 flex items-baseline justify-between gap-3">
              <h1 className="text-[20px] font-semibold text-[#222] lg:text-[22px]">
                {isLoading
                  ? "Searching stays…"
                  : city
                    ? `Over ${Math.max(properties.length, 1).toLocaleString()} homes in ${city}`
                    : `${Math.max(properties.length, 0).toLocaleString()} stays available`}
              </h1>
              <p className="hidden shrink-0 text-[13px] text-[#717171] sm:block">
                Prices include all fees
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardLoader key={i} type="property_card" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <p className="py-20 text-center text-[14px] text-[#717171]">
                No properties match your filters.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-x-4 gap-y-6">
                {properties.map((p: PropertyWithRoomTypes, i: number) => (
                  <div
                    key={p.id}
                    onMouseEnter={() => setActiveId(p.id)}
                    onMouseLeave={() => setActiveId(null)}
                    className={
                      activeId === p.id
                        ? "rounded-2xl ring-2 ring-[#17191c]"
                        : ""
                    }
                  >
                    <PropertyCard
                      property={p}
                      index={i}
                      isFavorited={favoritedSet.has(p.id)}
                      variant="search"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] p-3 pl-0 lg:block">
            <SearchMap
              properties={properties}
              activeId={activeId}
              onSelect={setActiveId}
              className="h-full rounded-2xl"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
