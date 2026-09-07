import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import AnimateTextWord from "@/components/common/AnimateTextWord";
import { useProperties } from "../Properties/hooks/useProperties";
import CardLoader from "@/components/common/loader/CardLoader";
import PropertyCard from "@/components/common/PropertyCard";
import { useListFavoritedIdsQuery } from "@/redux/services/favoriteApi";
import { selectAccessToken } from "@/redux/slices/authSlice";
import type { PropertyWithRoomTypes } from "@/types/api";

const Listing = () => {
  const { properties, isLoading } = useProperties();

  const token = useSelector(selectAccessToken);
  const visibleIds = (properties ?? []).slice(0, 6).map((p) => p.id);
  const { data: favoritedData } = useListFavoritedIdsQuery(visibleIds, {
    skip: !token || visibleIds.length === 0,
  });
  const favoritedSet = new Set(favoritedData?.data ?? []);

  return (
    <section data-scroll-section className="w-full py-20 lg:py-24">
      <div
        className="mx-auto w-full px-4 lg:px-0"
        style={{ maxWidth: "1280px" }}
      >
        <div className="mb-10 grid w-full grid-cols-1 items-end gap-6 lg:mb-14 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="text-sm md:text-base text-[var(--primary)]">
              Passionate – Dedicated – Professional
            </p>
            <h2 className="family2 text-4xl capitalize text-[var(--dark-1)] lg:text-5xl">
              <AnimateTextWord type="bigtext">Stays worth</AnimateTextWord>
              <AnimateTextWord type="bigtext">booking again</AnimateTextWord>
            </h2>
          </div>
          <div className="flex lg:justify-end">
            <Link
              to="/search"
              className="btn family1 rounded-full px-6 py-3.5 text-xs font-normal text-white md:px-8 md:text-base"
            >
              Browse all Homes
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardLoader key={index} type="property_card" />
            ))}
          </div>
        ) : (
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(properties?.slice(0, 6) ?? []).map(
              (p: PropertyWithRoomTypes, index: number) => (
                <PropertyCard
                  key={p.id}
                  variant="default"
                  index={index}
                  property={p}
                  isFavorited={favoritedSet.has(p.id)}
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Listing;