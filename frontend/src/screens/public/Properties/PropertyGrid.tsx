import PropertyCard  from "@/components/common/PropertyCard";
import type { Property } from "@/types/api";

interface Props {
  properties: Property[];
  isLoading:  boolean;
  search:     string;
  typeFilter: string;
  onClear:    () => void;
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl animate-pulse" style={{ aspectRatio: "4/5", backgroundColor: "#f2f0ed" }} />
      <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />
      <div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />
    </div>
  );
}

export default function PropertyGrid({ properties, isLoading, search, typeFilter, onClear }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
        {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (!properties.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>
          {search || typeFilter ? "No properties match your filter." : "No properties available yet."}
        </p>
        {(search || typeFilter) && (
          <button onClick={onClear} className="text-xs underline underline-offset-4"
                  style={{ color: "var(--color-muted-stone)" }}>
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
      {properties.map((p, index) => <PropertyCard index={index} key={p.id} property={p} />)}
    </div>
  );
}