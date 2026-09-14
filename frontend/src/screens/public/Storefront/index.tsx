import { useState, useMemo } from "react";
import { Search, Map as MapIcon, LayoutGrid, SlidersHorizontal } from "lucide-react";
import Footer from "@/components/common/Footer";
import PropertyGrid from "@/screens/public/Properties/PropertyGrid";
import SearchMap from "@/screens/public/Search/components/SearchMap";
import FiltersModal, { type SearchFiltersState } from "@/screens/public/Search/components/FiltersModal";
import StorefrontHeader from "./StorefrontHeader";
import StorefrontSkeletonGrid from "./StorefrontSkeletonGrid";
import { useTenantContext } from "@/hooks/useTenantContext";
import { useGetPropertiesQuery } from "@/redux/services/propertyApi";
import { PROPERTY_TYPES } from "@/constants/amenities";

const TYPE_TABS = [
  { label: "All", value: "" },
  ...PROPERTY_TYPES.map((t) => ({ label: t.label, value: t.value })),
];

const DEFAULT_FILTERS: SearchFiltersState = {
  placeType: "any",
  amenities: [],
  neighborhoods: [],
};

export default function TenantStorefront() {
  const {
    tenantId,
    tenantName,
    subdomain,
    isLoading: tenantLoading,
    isUnresolvedSubdomain,
  } = useTenantContext();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFiltersState>(DEFAULT_FILTERS);

  const activeFilterCount =
    (filters.placeType !== "any" ? 1 : 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.bedrooms != null ? 1 : 0) +
    (filters.beds != null ? 1 : 0) +
    (filters.bathrooms != null ? 1 : 0) +
    filters.amenities.length;

  const { data, isLoading: propertiesLoading } = useGetPropertiesQuery(
    {
      tenantId: tenantId ?? undefined,
      search: search || undefined,
      propertyType: typeFilter || undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      bedrooms: filters.bedrooms,
      beds: filters.beds,
      bathrooms: filters.bathrooms,
      amenities: filters.amenities.length ? filters.amenities.join(",") : undefined,
      page: 1,
      limit: 24,
    },
    { skip: !tenantId },
  );

  const properties = useMemo(() => data?.data ?? [], [data]);

  const clearAll = () => {
    setSearch("");
    setTypeFilter("");
    setFilters(DEFAULT_FILTERS);
  };

  if (tenantLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <StorefrontHeader tenantName={null} tenantSlug={null} />
        <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 lg:px-6 py-8">
          <StorefrontSkeletonGrid />
        </div>
      </div>
    );
  }

  if (isUnresolvedSubdomain) {
    return (
      <div className="flex flex-col min-h-screen">
        <StorefrontHeader tenantName={tenantName} tenantSlug={subdomain} />
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-24">
          <h1 className="text-lg font-semibold text-[#17171A]">
            This storefront doesn't exist
          </h1>
          <p className="text-sm text-[#777b86]">
            The subdomain you're on isn't linked to a seller. Check the link and
            try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <StorefrontHeader tenantName={tenantName} tenantSlug={subdomain} />

      <div className="sticky top-0 z-30 border-b border-[#ebebeb] bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a6af]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${tenantName ?? "listings"}`}
              className="h-10 w-full rounded-full border border-[#e8e6e3] pl-9 pr-3 text-[13px] outline-none focus:border-[#c4c6ce]"
            />
          </div>

          <button
            onClick={() => setFiltersOpen(true)}
            className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] transition-colors ${
              activeFilterCount > 0
                ? "border-[#17191c] bg-[#f7f7f5] font-medium text-[#17191c]"
                : "border-[#e8e6e3] text-[#5B5B66] hover:border-[#c4c6ce]"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#17191c] px-1 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 overflow-x-auto">
            {TYPE_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`h-9 shrink-0 rounded-full border px-4 text-[13px] transition-colors ${
                  typeFilter === t.value
                    ? "border-[#17191c] bg-[#f7f7f5] font-medium text-[#17191c]"
                    : "border-[#e8e6e3] text-[#5B5B66] hover:border-[#c4c6ce]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1 rounded-full border border-[#e8e6e3] p-1">
            <button
              onClick={() => setView("list")}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                view === "list" ? "bg-[#17191c] text-white" : "text-[#777b86]"
              }`}
              title="List view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                view === "map" ? "bg-[#17191c] text-white" : "text-[#777b86]"
              }`}
              title="Map view"
            >
              <MapIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onApply={(next) => setFilters(next)}
        resultCount={properties.length || undefined}
      />

      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 lg:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#17171A]">{tenantName}</h1>
          <p className="text-sm text-[#777b86] mt-1">
            {properties.length} listing{properties.length === 1 ? "" : "s"}{" "}
            available
          </p>
        </div>

        {view === "list" ? (
          propertiesLoading ? (
            <StorefrontSkeletonGrid />
          ) : (
            <PropertyGrid
              properties={properties}
              isLoading={false}
              search={search}
              typeFilter={typeFilter}
              onClear={clearAll}
            />
          )
        ) : (
          <div className="h-[70vh] rounded-2xl overflow-hidden border border-[#ebebeb]">
            <SearchMap
              properties={properties}
              activeId={activeId}
              onSelect={setActiveId}
              className="h-full"
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}