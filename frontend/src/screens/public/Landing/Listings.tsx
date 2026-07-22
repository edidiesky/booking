import AnimateTextWord from "@/components/common/AnimateTextWord";
import { useProperties } from "../Properties/hooks/useProperties";
import CardLoader from "@/components/common/loader/CardLoader";
import PropertyCard from "@/components/common/PropertyCard";

const Listing = () => {
  const {
      properties, isLoading,
    } = useProperties();
  
  // console.log("room payload:", { isLoading, rooms });
  return (
    <div data-scroll-section className="w-full flex py-32 flex-col">
      <div className="max-w-screen-xl mx-auto flex flex-col gap-20">
        <div className="grid lg:grid-cols-2 gap-4 items-start lg:items-center w-full">
          <div className="flex flex-col gap-4">
            <h4 className="text-sm md:text-lg text-[var(--primary)]">
              Passionate – Dedicated – Professional
            </h4>
            <h4 className="text-4xl capitalize max-w-[600px] md:text-5xl family2 text-[var(--dark-1)]">
              <AnimateTextWord type={"bigtext"}>
                Holiday accomodations recommendations for you
              </AnimateTextWord>
            </h4>
          </div>
          <div className="flex lg:items-center md:justify-end">
            <button className="btn btn md:px-8 px-4 py-4 text-xs md:text-xs family1 text-white font-normal">
              Browse all Homes
            </button>
          </div>
        </div>
        <div className="w-full gap-x-8 gap-y-16 max-w-custom_1 columns-2 sm:columns-3 lg:columns-4 gap-4">
          {isLoading ? (
            <>
              {properties?.slice(0, 3).map((_, index) => {
                return <CardLoader key={index} />;
              })}
            </>
          ) : (
            <>
              {properties?.slice(0, 3)?.map((p, index) => {
                return (
                  <PropertyCard key={index} property={p} />
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Listing;
