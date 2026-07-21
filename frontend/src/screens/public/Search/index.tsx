import { motion } from "framer-motion";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import PropertyCard from "@/components/common/PropertyCard";
import { useSearch } from "./hooks/useSearch";
import { useState } from "react";
import FilterPanel from "./FilterPanel";

const PROPERTY_TYPES = [
  { label: "All types", value: "" },
  { label: "Shortlet", value: "shortlet" },
  { label: "Hotel", value: "hotel" },
  { label: "Guesthouse", value: "guesthouse" },
];

const SORTS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export default function SearchPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    properties,
    isLoading,
    search,
    setSearch,
    propertyType,
    setPropertyType,
    city,
    setCity,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    guests,
    setGuests,
    sort,
    setSort,
  } = useSearch();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col min-h-screen"
    >
      <Header />

      <main className="flex-1">
        <div className="w-[90%] max-w-[1280px] mx-auto py-10 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <FilterPanel
              open={filtersOpen}
              onClose={() => setFiltersOpen(false)}
            >
              <input
                type="text"
                placeholder="Search by property name or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 px-4 border border-[#e8e6e3] rounded-full text-xs outline-none"
              />
              {/* existing filter controls: property type, price range, guests, sort */}
            </FilterPanel>

            <div className="flex flex-wrap gap-3">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="h-9 px-3 border border-[#e8e6e3] rounded-full text-xs outline-none"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-9 px-3 border border-[#e8e6e3] rounded-full text-xs outline-none w-32"
              />

              <input
                type="number"
                placeholder="Min price"
                value={minPrice ?? ""}
                onChange={(e) =>
                  setMinPrice(
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="h-9 px-3 border border-[#e8e6e3] rounded-full text-xs outline-none w-28"
              />

              <input
                type="number"
                placeholder="Max price"
                value={maxPrice ?? ""}
                onChange={(e) =>
                  setMaxPrice(
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="h-9 px-3 border border-[#e8e6e3] rounded-full text-xs outline-none w-28"
              />

              <input
                type="number"
                placeholder="Guests"
                value={guests ?? ""}
                onChange={(e) =>
                  setGuests(e.target.value ? Number(e.target.value) : undefined)
                }
                className="h-9 px-3 border border-[#e8e6e3] rounded-full text-xs outline-none w-24"
              />

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-9 px-3 border border-[#e8e6e3] rounded-full text-xs outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div
                    className="rounded-xl animate-pulse bg-[#f2f0ed]"
                    style={{ aspectRatio: "4/5" }}
                  />
                  <div className="h-4 w-3/4 rounded animate-pulse bg-[#f2f0ed]" />
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <p className="text-xs text-[#a3a6af] text-center py-20">
              No properties match your filters.
            </p>
          ) : (
            <motion.div
            animate={{ marginLeft: filtersOpen ? 320 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
              {properties.map((p, i) => (
                <div key={p.id} className="break-inside-avoid">
                  <PropertyCard property={p} index={i} />
                </div>
              ))}
            </div>
          </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}
