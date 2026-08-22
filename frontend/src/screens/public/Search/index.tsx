import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import PropertyCard from "@/components/common/PropertyCard";
import CardLoader from "@/components/common/loader/CardLoader";
import { useSearch } from "./hooks/useSearch";
import FilterPanel from "./FilterPanel";
import SearchSidebar from "./SearchSidebar";
import { useListFavoritedIdsQuery } from "@/redux/services/favoriteApi";
import { selectAccessToken } from "@/redux/slices/authSlice";
import { PropertyWithRoomTypes } from "@/types/api";

const SORTS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export default function SearchPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    properties, isLoading,
    search, setSearch,
    propertyType, setPropertyType,
    city,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    guests, setGuests,
    sort, setSort,
    isDefaultCity,
  } = useSearch();

  const token = useSelector(selectAccessToken);
  const ids = properties.map((p: PropertyWithRoomTypes) => p.id);
  const { data: favoritedData } = useListFavoritedIdsQuery(ids, { skip: !token || ids.length === 0 });
  const favoritedSet = new Set(favoritedData?.data ?? []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
      <Header />

      {/* Mobile filter drawer, unchanged mechanism, still the right
          call at narrow widths where a persistent sidebar has nowhere
          to live. */}
      <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <SearchSidebar
          propertyType={propertyType} setPropertyType={setPropertyType}
          minPrice={minPrice} setMinPrice={setMinPrice}
          maxPrice={maxPrice} setMaxPrice={setMaxPrice}
          guests={guests} setGuests={setGuests}
        />
      </FilterPanel>

      <main className="flex-1">
        <div className="w-[90%] max-w-[1280px] mx-auto py-10 flex gap-8">
          <div className="hidden lg:block">
            <SearchSidebar
              propertyType={propertyType} setPropertyType={setPropertyType}
              minPrice={minPrice} setMinPrice={setMinPrice}
              maxPrice={maxPrice} setMaxPrice={setMaxPrice}
              guests={guests} setGuests={setGuests}
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm" style={{ color: "#777b86" }}>
                {isDefaultCity ? (
                  <>Showing results for <span className="bold" style={{ color: "#17191c" }}>{city}</span> (default), search a different city to change this.</>
                ) : (
                  <>Showing results for <span className="bold" style={{ color: "#17191c" }}>{city}</span></>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden h-9 px-3 flex items-center gap-2 border rounded-full text-xs"
                  style={{ borderColor: "#e8e6e3" }}
                >
                  <SlidersHorizontal size={13} />
                  Filters
                </button>

                <input
                  type="text"
                  placeholder="Search by property name or city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 min-w-[200px] h-10 px-4 border rounded-full text-xs lg:text-[13px]   outline-none"
                  style={{ borderColor: "#e8e6e3" }}
                />

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-10 px-3 border rounded-full text-xs lg:text-[13px]   outline-none"
                  style={{ borderColor: "#e8e6e3" }}
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardLoader key={i} type="property_card" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <p className="text-xs lg:text-[13px]     text-center py-20" style={{ color: "#a3a6af" }}>
                No properties match your filters.
              </p>
            ) : (
              <div className="columns-2 sm:columns-3 gap-4 space-y-4">
                {properties.map((p: PropertyWithRoomTypes, i: number) => (
                  <div key={p.id} className="break-inside-avoid">
                    <PropertyCard property={p} index={i} isFavorited={favoritedSet.has(p.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}