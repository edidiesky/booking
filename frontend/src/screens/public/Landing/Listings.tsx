import { useSelector } from "react-redux";
import AnimateTextWord from "@/components/common/AnimateTextWord";
import { useProperties } from "../Properties/hooks/useProperties";
import CardLoader from "@/components/common/loader/CardLoader";
import PropertyCard from "@/components/common/PropertyCard";
// import InfiniteDragRow from "@/components/common/InfiniteDragRow";
import { useListFavoritedIdsQuery } from "@/redux/services/favoriteApi";
import { selectAccessToken } from "@/redux/slices/authSlice";
import { PropertyWithRoomTypes } from "@/types/api";

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
      <div className="mx-auto px-4 lg:px-0 pt-32 pb-20 flex flex-col gap-8 lg:gap-20" style={{ maxWidth: "1280px" }}>
        <div className="grid lg:grid-cols-2 gap-4 items-start lg:items-center w-full">
          <div className="flex flex-col gap-4">
            <h4 className="text-xs lg:text-[13px] md:text-lg text-[var(--primary)]">
              Passionate – Dedicated – Professional
            </h4>
            <h4 className="text-4xl lg:text-6xl capitalize family2 text-[var(--dark-1)]">
              <AnimateTextWord type={"bigtext"}>
                Stays worth booking again
              </AnimateTextWord>
            </h4>
          </div>
          <div className="flex lg:items-center md:justify-end">
            <button className="btn rounded-full md:px-8 px-4 py-4 text-xs md:text-base family1 text-white font-normal">
              Browse all Homes
            </button>
          </div>
        </div>
        <div className="w-full">
          {isLoading ? (
            <div className="columns-2 lg:columns-3 gap-4 space-y-4">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="break-inside-avoid"><CardLoader type="property_card" /></div>
              ))}
            </div>
          ) : (
            <div className="columns-2 lg:columns-3 gap-4 space-y-4">
              {(properties?.slice(0, 6) ?? []).map((p: PropertyWithRoomTypes, index: number) => (
                <div key={p.id} className="break-inside-avoid">
                  <PropertyCard index={index} property={p} isFavorited={favoritedSet.has(p.id)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Listing;