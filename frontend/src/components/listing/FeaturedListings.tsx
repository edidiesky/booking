import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetPropertiesQuery } from "@/redux/services/propertyApi";
import { useListFavoritedIdsQuery } from "@/redux/services/favoriteApi";
import { selectAccessToken } from "@/redux/slices/authSlice";
import SectionHeading from "@/components/marketing/SectionHeading";
import ListingCard from "./ListingCard";
import ListingCardSkeleton from "./ListingCardSkeleton";
import SeeMoreTile from "./SeeMoreTile";
import { toListingCard } from "./toListingCard";

const COUNT = 11; // + See more tile = 12, divisible by 2, 3 and 4 columns.

/**
 * Fallback data path: the list endpoint. When the backend ships
 * GET /properties-discovery/featured (ListingCardDTO), swap the query here;
 * nothing below changes.
 */
export default function FeaturedListings({
  title = "Featured stays",
  lead = "The newest verified listings. Every price is the full nightly price, fees included.",
}: {
  title?: string;
  lead?: string;
}) {
  const { data, isLoading, isError, refetch } = useGetPropertiesQuery({ page: 1, limit: COUNT });
  const token = useSelector(selectAccessToken);

  const listings = useMemo(() => (data?.data ?? []).slice(0, COUNT).map(toListingCard), [data]);
  const ids = listings.map((l) => l.id);
  const { data: saved } = useListFavoritedIdsQuery(ids, { skip: !token || ids.length === 0 });
  const savedSet = new Set(saved?.data ?? []);
  const moreImages = listings.slice(COUNT - 3).flatMap((l) => l.images.slice(0, 1));

  return (
    <section className="mk-section" aria-labelledby="featured-heading">
      <div className="mk-container">
        <SectionHeading
          id="featured-heading"
          kicker="Book now"
          title={title}
          lead={lead}
          action={
            <Link to="/search" className="mk-btn mk-btn-ghost">
              Browse all stays
            </Link>
          }
        />

        {isError ? (
          <div className="mk-card flex flex-col items-start gap-4 p-8">
            <p className="text-[1.125rem] font-[600]">Listings did not load.</p>
            <p className="mk-body">Check your connection, then try again.</p>
            <button type="button" onClick={() => refetch()} className="mk-btn mk-btn-primary mk-btn-sm">
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)
              : listings.map((l) => <ListingCard key={l.id} listing={l} isSaved={savedSet.has(l.id)} />)}
            {!isLoading && listings.length > 0 && <SeeMoreTile images={moreImages} />}
          </div>
        )}
        {!isLoading && !isError && listings.length === 0 && (
          <div className="mk-card flex flex-col items-start gap-4 p-8">
            <p className="text-[1.125rem] font-[600]">No stays are live yet.</p>
            <p className="mk-body">Hosts are being verified. List yours and be one of the first.</p>
            <Link to="/hosts" className="mk-btn mk-btn-primary mk-btn-sm">
              List your property
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
