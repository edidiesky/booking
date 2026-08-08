import { useNavigate } from "react-router-dom";
import MaskRevealText from "@/components/common/MaskRevealText";
import PropertySearchBar, {
  type PropertySearchValue,
} from "@/components/common/search/PropertySearchBar";

const profilesList = [
  "/user_1.jpg",
  "/user_2.jpg",
  "/user_3.jpg",
  "/user_4.jpg",
  "/user_5.jpg",
];

export default function Hero() {
  const navigate = useNavigate();

  const handleSearch = (value: PropertySearchValue) => {
    const params = new URLSearchParams();
    if (value.query) params.set("q", value.query);
    if (value.location) params.set("city", value.location);
    if (!value.propertyTypes.includes("any"))
      params.set("propertyType", value.propertyTypes.join(","));
    if (value.minPrice) params.set("minPrice", String(value.minPrice));
    if (value.maxPrice) params.set("maxPrice", String(value.maxPrice));
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full min-h-screen flex items-center relative">
      <img
        src="/hero.jpg"
        alt=""
        className="w-full h-full absolute inset-0 object-cover"
      />
      <div className="w-full h-full absolute inset-0 bg-[rgba(0,0,0,.5)]" />
      <div className="w-full h-full mx-auto flex items-center justify-between max-w-screen-xl relative py-24">
        <div className="max-w-screen-2xl px-4 relative z-10 flex flex-col  gap-10 w-full">
          <div className="flex items-center  gap-4">
            <div className="flex items-center gap-2">
              {profilesList.map((face, index) => (
                <div
                  key={index}
                  className={`${index !== 0 ? "-ml-6" : ""} w-12 h-12 border-2 border-white z-20 overflow-hidden rounded-full`}
                >
                  <img
                    src={face}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
              ))}
            </div>
            <span className="text-xs lg:text-[13px]text-[#eee] capitalize">
              5K+ guests booked with confidence
            </span>
          </div>

          <div className="flex flex-col gap-3 max-w-[520px] lg:max-w-[820px] text-start">
            <h1
              className="text-white family1 text-5xl max-w-[320px] md:max-w-[620px] lg:max-w-[820px] lg:text-7xl bold"
            >
              Shortlets, hotels &amp; guesthouses, booked  <br /> in seconds.
            </h1>
            <MaskRevealText
              as="p"
              delay={0.3}
              className="text-base md:text-lg text-gray-300 max-w-[560px]"
            >
              Pay securely into escrow, check in smoothly, check out
              stress-free. Every booking on this platform is protected until
              your stay is done.
            </MaskRevealText>
          </div>

          <div className="w-full lg:block hidden max-w-5xl">
            <PropertySearchBar onSearch={handleSearch} />
          </div>

          {/* {!isAuthenticated && (
            <button
              onClick={() => navigate("/select-user-type")}
              className="text-xs lg:text-[13px]text-white underline"
            >
              List your property instead &rarr;
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
}
