import { Link } from "react-router-dom";
import PropertyCard from "@/components/common/PropertyCard";
import InfiniteDragRow from "@/components/common/InfiniteDragRow";
import CardLoader from "@/components/common/loader/CardLoader";
import { useGetPopularPropertiesQuery, useGetNewPropertiesQuery } from "@/redux/services/discoveryApi";

function DiscoveryRow({ title, subtitle, seeAllHref, data, isLoading }: {
  title: string; subtitle: string; seeAllHref: string; data: any[]; isLoading: boolean;
}) {
  return (
    <section className="max-w-screen-xl mx-auto px-4 lg:px-0 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h3 className="text-xl lg:text-2xl bold" style={{ color: "var(--color-ink)" }}>{title}</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-stone)" }}>{subtitle}</p>
        </div>
        <Link to={seeAllHref} className="text-sm bold underline shrink-0" style={{ color: "var(--color-ink)" }}>
          See all
        </Link>
      </div>

      {isLoading ? (
        <div className="flex gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[280px] shrink-0"><CardLoader type="property_card" /></div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm py-8" style={{ color: "var(--color-muted-stone)" }}>Nothing to show here yet.</p>
      ) : (
        <InfiniteDragRow gap={20}>
          {data.map((p, i) => (
            <div key={i} className="w-[280px] lg:w-[320px]">
              <PropertyCard property={p} variant="compact" />
            </div>
          ))}
        </InfiniteDragRow>
      )}
    </section>
  );
}

// Two independent discovery rows for the landing page, "Popular"
// backed by the popularity materialized view, "New" by a plain
// indexed query, per the design tradeoff explained where the view is
// defined, materializing "new" would add refresh overhead for a query
// that's already fast.
export default function PopularAndNewSections() {
  const { data: popularData, isLoading: loadingPopular } = useGetPopularPropertiesQuery({ limit: 12 });
  const { data: newData,     isLoading: loadingNew }     = useGetNewPropertiesQuery({ limit: 12 });

  return (
    <>
      <DiscoveryRow
        title="Popular right now"
        subtitle="Most booked, favorited, and highest rated on the platform."
        seeAllHref="/search?sort=popular"
        data={popularData?.data ?? []}
        isLoading={loadingPopular}
      />
      <DiscoveryRow
        title="New listings"
        subtitle="Just added, be the first to book."
        seeAllHref="/search?sort=newest"
        data={newData?.data ?? []}
        isLoading={loadingNew}
      />
    </>
  );
}