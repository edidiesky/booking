import { useSelector } from "react-redux";
import AnimateTextWord from "@/components/common/AnimateTextWord";
import { useProperties } from "../Properties/hooks/useProperties";
import CardLoader from "@/components/common/loader/CardLoader";
import PropertyCard from "@/components/common/PropertyCard";
import InfiniteDragRow from "@/components/common/InfiniteDragRow";
import { useListFavoritedIdsQuery } from "@/redux/services/favoriteApi";
import { selectAccessToken } from "@/redux/slices/authSlice";

const Listing = () => {
  const {
      properties, isLoading,
    } = useProperties();

  const token = useSelector(selectAccessToken);
  const visibleIds = (properties ?? []).slice(0, 3).map((p) => p.id);
  const { data: favoritedData } = useListFavoritedIdsQuery(visibleIds, { skip: !token || visibleIds.length === 0 });
  const favoritedSet = new Set(favoritedData?.data ?? []);
  
  // console.log("room payload:", { isLoading, rooms });
  return (
    <div data-scroll-section className="w-full flex py-32 flex-col">
      <div className="max-w-screen-xl mx-auto flex flex-col gap-20">
        <div className="grid lg:grid-cols-2 gap-4 items-start lg:items-center w-full">
          <div className="flex flex-col gap-4">
            <h4 className="text-xs md:text-lg text-[var(--primary)]">
              Passionate – Dedicated – Professional
            </h4>
            <h4 className="text-4xl lg:text-5xl capitalize max-w-[900px] family2 text-[var(--dark-1)]">
              <AnimateTextWord type={"bigtext"}>
                Holiday accomodations recommendations for you
              </AnimateTextWord>
            </h4>
          </div>
          <div className="flex lg:items-center md:justify-end">
            <button className="btn btn md:px-8 px-4 py-4 text-xs md:text-base family1 text-white font-normal">
              Browse all Homes
            </button>
          </div>
        </div>
        <div className="w-full max-w-custom_1">
          {isLoading ? (
            <div className="flex gap-5">
              {properties.map((_, index) => (
                <div key={index} className="w-[280px] shrink-0"><CardLoader type="property_card" /></div>
              ))}
            </div>
          ) : (
            <InfiniteDragRow gap={14}>
              {(properties?.slice(0, 8) ?? []).map((p, index) => (
                <div key={index} className="w-[280px] lg:w-[370px] space-x-8">
                  <PropertyCard index={index} property={p} isFavorited={favoritedSet.has(p.id)} />
                </div>
              ))}
            </InfiniteDragRow>
          )}
        </div>
      </div>
    </div>
  );
};

export default Listing;