// import { useNavigate } from "react-router-dom";
// import MaskRevealText from "@/components/common/MaskRevealText";
// import PropertySearchBar, {
//   type PropertySearchValue,
// } from "@/components/common/search/PropertySearchBar";

// const profilesList = [
//   "/user_1.jpg",
//   "/user_2.jpg",
//   "/user_3.jpg",
//   "/user_4.jpg",
//   "/user_5.jpg",
// ];

// export default function Hero() {
//   const navigate = useNavigate();

//   const handleSearch = (value: PropertySearchValue) => {
//     const params = new URLSearchParams();
//     if (value.query) params.set("q", value.query);
//     if (value.location) params.set("city", value.location);
//     if (!value.propertyTypes.includes("any"))
//       params.set("propertyType", value.propertyTypes.join(","));
//     if (value.minPrice) params.set("minPrice", String(value.minPrice));
//     if (value.maxPrice) params.set("maxPrice", String(value.maxPrice));
//     navigate(`/search?${params.toString()}`);
//   };

//   return (
//     <div className="w-full min-h-screen flex items-center relative">
//       <img
//         src="/hero.jpg"
//         alt=""
//         className="w-full h-full absolute inset-0 object-cover"
//       />
//       <div className="w-full h-full absolute inset-0 bg-[rgba(0,0,0,.5)]" />
//       <div className="w-full h-full mx-auto flex items-center justify-between max-w-screen-xl relative py-24">
//         <div className="max-w-screen-2xl px-4 relative z-10 flex flex-col  gap-10 w-full">
//           <div className="flex items-center  gap-4">
//             <div className="flex items-center gap-2">
//               {profilesList.map((face, index) => (
//                 <div
//                   key={index}
//                   className={`${index !== 0 ? "-ml-6" : ""} w-12 h-12 border-2 border-white z-20 overflow-hidden rounded-full`}
//                 >
//                   <img
//                     src={face}
//                     className="w-full h-full object-cover"
//                     alt=""
//                   />
//                 </div>
//               ))}
//             </div>
//             <span className="text-xs lg:text-[13px]text-[#eee] capitalize">
//               5K+ guests booked with confidence
//             </span>
//           </div>

//           <div className="flex flex-col gap-3 max-w-[520px] lg:max-w-[820px] text-start">
//             <h1
//               className="text-white family1 text-5xl max-w-[320px] md:max-w-[620px] lg:max-w-[820px] lg:text-7xl bold"
//             >
//               Shortlets, hotels &amp; guesthouses, booked  <br /> in seconds.
//             </h1>
//             <MaskRevealText
//               as="p"
//               delay={0.3}
//               className="text-base md:text-lg text-gray-300 max-w-[560px]"
//             >
//               Pay securely into escrow, check in smoothly, check out
//               stress-free. Every booking on this platform is protected until
//               your stay is done.
//             </MaskRevealText>
//           </div>

//           <div className="w-full lg:block hidden max-w-5xl">
//             <PropertySearchBar onSearch={handleSearch} />
//           </div>

//           {/* {!isAuthenticated && (
//             <button
//               onClick={() => navigate("/select-user-type")}
//               className="text-xs lg:text-[13px]text-white underline"
//             >
//               List your property instead &rarr;
//             </button>
//           )} */}
//         </div>
//       </div>
//     </div>
//   );
// }


// import { useState, useRef, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useReducedMotion } from "framer-motion";
// import MaskRevealText from "@/components/common/MaskRevealText";
// import PropertySearchBar, {
//   type PropertySearchValue,
// } from "@/components/common/search/PropertySearchBar";

// const profilesList = [
//   "/user_1.jpg",
//   "/user_2.jpg",
//   "/user_3.jpg",
//   "/user_4.jpg",
//   "/user_5.jpg",
// ];

// // PLACEHOLDERS, these are vivre.agency's own hosted assets, not
// // licensed for reuse here, swap for real, owned/licensed footage
// // before this ships to production.
// const HERO_VIDEO_SRC  = "https://vivre.agency/wp-content/uploads/2026/01/intro-vivre-small.mp4";
// const HERO_POSTER_SRC = "https://vivre.agency/wp-content/uploads/2026/01/hero-poster-home.avif";

// export default function Hero() {
//   const navigate = useNavigate();
//   const prefersReducedMotion = useReducedMotion();
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [videoReady, setVideoReady] = useState(false);

//   const handleSearch = (value: PropertySearchValue) => {
//     const params = new URLSearchParams();
//     if (value.query) params.set("q", value.query);
//     if (value.location) params.set("city", value.location);
//     if (!value.propertyTypes.includes("any"))
//       params.set("propertyType", value.propertyTypes.join(","));
//     if (value.minPrice) params.set("minPrice", String(value.minPrice));
//     if (value.maxPrice) params.set("maxPrice", String(value.maxPrice));
//     navigate(`/search?${params.toString()}`);
//   };

//   // Video only on desktop, real reason, not arbitrary: a background
//   // video is purely decorative, burning mobile data/battery for it is
//   // a real cost with no functional benefit. Poster image alone is the
//   // entire mobile experience.
//   const showVideo =
//     !prefersReducedMotion &&
//     typeof window !== "undefined" &&
//     window.matchMedia("(min-width: 1024px)").matches;

//   useEffect(() => {
//     if (!showVideo) return;
//     const video = videoRef.current;
//     if (!video) return;
//     const onReady = () => setVideoReady(true);
//     video.addEventListener("canplaythrough", onReady, { once: true });
//     return () => video.removeEventListener("canplaythrough", onReady);
//   }, [showVideo]);

//   return (
//     <div className="w-full min-h-screen flex items-center relative overflow-hidden">
//       {/* Poster is always present, video fades in over it once ready,
//           this is what prevents a flash of the wrong image before the
//           video has actually buffered enough to play. */}
//       <img
//         src={showVideo ? HERO_POSTER_SRC : "/hero.jpg"}
//         alt=""
//         className="w-full h-full absolute inset-0 object-cover"
//       />

//       {showVideo && (
//         <video
//           ref={videoRef}
//           className={`w-full h-full absolute inset-0 object-cover transition-opacity duration-1000 ${
//             videoReady ? "opacity-100" : "opacity-0"
//           }`}
//           poster={HERO_POSTER_SRC}
//           loop
//           autoPlay
//           muted
//           playsInline
//           preload="auto"
//           // @ts-expect-error fetchPriority isn't yet in React's DOM types
//           fetchpriority="high"
//         >
//           <source src={HERO_VIDEO_SRC} type="video/mp4" />
//         </video>
//       )}

//       <div className="w-full h-full absolute inset-0 bg-[rgba(0,0,0,.5)]" />

//       <div className="w-full h-full mx-auto flex items-center justify-between max-w-screen-xl relative py-24">
//         <div className="max-w-screen-2xl px-4 relative z-10 flex flex-col gap-10 w-full">
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2">
//               {profilesList.map((face, index) => (
//                 <div
//                   key={index}
//                   className={`${index !== 0 ? "-ml-6" : ""} w-12 h-12 border-2 border-white z-20 overflow-hidden rounded-full`}
//                 >
//                   <img src={face} className="w-full h-full object-cover" alt="" />
//                 </div>
//               ))}
//             </div>
//             <span className="text-xs lg:text-[13px]text-[#eee] capitalize">
//               5K+ guests booked with confidence
//             </span>
//           </div>

//           <div className="flex flex-col gap-3 max-w-[520px] lg:max-w-[820px] text-start">
//             <h1 className="text-white family1 text-5xl max-w-[320px] md:max-w-[620px] lg:max-w-[820px] lg:text-7xl bold">
//               Shortlets, hotels &amp; guesthouses, booked <br /> in seconds.
//             </h1>
//             <MaskRevealText
//               as="p"
//               delay={0.3}
//               className="text-base md:text-lg text-gray-300 max-w-[560px]"
//             >
//               Pay securely into escrow, check in smoothly, check out
//               stress-free. Every booking on this platform is protected until
//               your stay is done.
//             </MaskRevealText>
//           </div>

//           <div className="w-full lg:block hidden max-w-5xl">
//             <PropertySearchBar onSearch={handleSearch} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useRef, useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { selectCurrentUser, selectIsAuthenticated } from "@/redux/slices/authSlice"; // confirm real path/name
import MaskRevealText from "@/components/common/MaskRevealText";

const profilesList = ["/user_1.jpg", "/user_2.jpg", "/user_3.jpg", "/user_4.jpg", "/user_5.jpg"];

const HERO_VIDEO_SRC  = "https://vivre.agency/wp-content/uploads/2026/01/intro-vivre-small.mp4";
const HERO_POSTER_SRC = "https://vivre.agency/wp-content/uploads/2026/01/hero-poster-home.avif";

export default function Hero() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const isHost = currentUser?.userType.startsWith("host:") ?? false;

  const showVideo =
    !prefersReducedMotion &&
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches;

  useEffect(() => {
    if (!showVideo) return;
    const video = videoRef.current;
    if (!video) return;
    const onReady = () => setVideoReady(true);
    video.addEventListener("canplaythrough", onReady, { once: true });
    return () => video.removeEventListener("canplaythrough", onReady);
  }, [showVideo]);

  return (
    <div className="w-full min-h-screen flex items-end relative overflow-hidden">
      <img
        src={showVideo ? HERO_POSTER_SRC : "/hero.jpg"}
        alt=""
        className="w-full h-full absolute inset-0 object-cover"
      />

      {showVideo && (
        <video
          ref={videoRef}
          className={`w-full h-full absolute inset-0 object-cover transition-opacity duration-1000 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          poster={HERO_POSTER_SRC}
          loop
          autoPlay
          muted
          playsInline
          preload="auto"
          // @ts-expect-error fetchPriority isn't yet in React's DOM types
          fetchpriority="high"
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
      )}

      <div className="w-full h-full absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

      <div className="w-full h-full mx-auto flex items-end max-w-screen-xl relative pb-20 lg:pb-24">
        <div className="max-w-screen-2xl px-4 lg:px-0 relative z-10 flex flex-col gap-8 w-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {profilesList.map((face, index) => (
                <div
                  key={index}
                  className={`${index !== 0 ? "-ml-6" : ""} w-8 lg:w-12 h-8 lg:h-12 border-2 border-white z-20 overflow-hidden rounded-full`}
                >
                  <img src={face} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
            </div>
            <span className="text-sm lg:text-base text-[#eee] capitalize">
              5K+ guests booked with confidence
            </span>
          </div>

          <div className="flex flex-col gap-3 max-w-[520px] lg:max-w-[820px] text-start">
            <h1 className="text-white family1 text-5xl max-w-[320px] md:max-w-[620px] lg:max-w-[820px] lg:text-7xl bold">
              Stay somewhere real. <br /> Pay with nothing to lose.
            </h1>
            <MaskRevealText
              as="p"
              delay={0.3}
              className="text-base md:text-lg text-gray-300 max-w-[560px]"
            >
              Every booking held in escrow until checkout. No wire transfers
              to strangers, no listing that looked different in person.
            </MaskRevealText>
          </div>

          <div className="flex flex-row items-center gap-3">
            <button
              onClick={() => navigate("/search")}
              className="w-fit flex items-center min-w-44 gap-2 px-6 py-4 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors"
            >
              View properties
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => navigate(isHost ? "/dashboard" : "/search")}
                className="w-fit min-w-44 flex items-center gap-2 px-6 py-4 rounded-full border border-white/40 text-white font-medium hover:bg-white/10 transition-colors"
              >
                {isHost ? "Go to your dashboard" : "Start booking"}
              </button>
            ) : (
              <Link
                to="/onboarding"
                className="w-fit min-w-44 justify-center flex items-center h-14 px-6 text-sm font-medium transition-opacity hover:opacity-80 rounded-full border border-white/40 text-white"
              >
                Get started
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}