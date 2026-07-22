// import { useNavigate }    from "react-router-dom";
// import { useSelector }    from "react-redux";
// import { motion }         from "framer-motion";
// import { ArrowRight, MapPin, Calendar, Search } from "lucide-react";
// import { selectCurrentUser, selectIsAuthenticated } from "@/redux/slices/authSlice";

// export default function Hero() {
//   const navigate        = useNavigate();
  // const currentUser     = useSelector(selectCurrentUser);
  // const isAuthenticated = useSelector(selectIsAuthenticated);

  // const handleCta = () => {
  //   if (!isAuthenticated)                        { navigate("/select-user-type"); return; }
  //   if (currentUser?.userType.startsWith("host:")) { navigate("/dashboard");       return; }
  //   navigate("/properties");
  // };

//   return (
//     <section className="w-full overflow-hidden" style={{ backgroundColor: "var(--color-canvas)" }}>
//       <div className="mx-auto px-6 lg:px-8 pt-20 pb-16" style={{ maxWidth: "1280px" }}>
//         <div className="flex flex-col gap-8 items-center justify-center">

//           <motion.div
//             initial={{ opacity: 0, y: 8 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.4 }}
//             className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs"
//             style={{ borderColor: "#e8e6e3", color: "var(--color-muted-stone)" }}
//           >
//             <MapPin size={13} />
//             Properties across Nigeria
//           </motion.div>

//           <motion.h1
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.1 }}
//             className="text-center leading-[1.05]"
//             style={{
//               fontSize:      "clamp(48px, 8vw, 80px)",
//               color:         "var(--color-ink)",
//               letterSpacing: "-0.025em",
//               fontFamily:    "'Georgia', serif",
//             }}
//           >
//             Find your next
//             <br />
//             perfect stay.
//             <br />
//             <span style={{ color: "var(--color-terracotta)" }}>
//               Book with ease.
//             </span>
//           </motion.h1>

//           <motion.p
//             initial={{ opacity: 0, y: 16 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.2 }}
//             className="text-xs lg:text-lg text-center leading-relaxed max-w-md"
//             style={{ color: "var(--color-muted-stone)" }}
//           >
//             Browse shortlets, hotels, and guesthouses. Pay securely,
//             check in smoothly, and check out stress-free.
//           </motion.p>

          // <motion.div
          //   initial={{ opacity: 0, y: 16 }}
          //   animate={{ opacity: 1, y: 0 }}
          //   transition={{ duration: 0.5, delay: 0.3 }}
          //   className="flex items-center gap-3 flex-wrap justify-center"
          // >
          //   <button
          //     onClick={handleCta}
          //     className="h-14 px-7 text-xs flex items-center gap-2 transition-opacity hover:opacity-80 rounded-full"
          //     style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
          //   >
          //     {isAuthenticated ? "Browse Properties" : "Get started"}
          //     <ArrowRight size={14} />
          //   </button>
          //   {!isAuthenticated && (
          //     <button
          //       onClick={() => navigate("/login")}
          //       className="h-14 px-7 text-xs border transition-opacity hover:opacity-70 rounded-full"
          //       style={{ color: "var(--color-ink)", borderColor: "var(--color-ink)" }}
          //     >
          //       Log in
          //     </button>
          //   )}
          // </motion.div>

//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.5, delay: 0.4 }}
//             className="flex items-center gap-4 pt-2"
//           >
//             {[
//               { icon: Search,   label: "Browse properties"  },
//               { icon: Calendar, label: "Book instantly"      },
//               { icon: MapPin,   label: "Across Nigeria"      },
//             ].map(({ icon: Icon, label }) => (
//               <div key={label} className="flex items-center gap-1.5 text-xs"
//                    style={{ color: "var(--color-muted-stone)" }}>
//                 <Icon size={14} />
//                 {label}
//               </div>
//             ))}
//           </motion.div>
//         </div>
//       </div>
//     </section>
//   );
// }

import React, { useEffect, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import moment from "moment";
import { BiSearch } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { selectCurrentUser, selectIsAuthenticated } from "@/redux/slices/authSlice";

const linkData = [
  {
    title: "Home",
    path: "",
  },
  {
    title: "Our Listings",
    path: "search",
  },
  {
    title: "My Favourites",
    path: "savedhomes",
  },
  {
    title: "My Trips",
    path: "trips",
  },
];

const profilesList = [
  "/user_1.jpg",
  "/user_2.jpg",
  "/user_3.jpg",
  "/user_4.jpg",
  "/user_5.jpg",
];
const Hero = () => {
  const navigate        = useNavigate();
  const [bar, setBar] = React.useState(false);

    const currentUser     = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

    const handleCta = () => {
    if (!isAuthenticated)                        { navigate("/select-user-type"); return; }
    if (currentUser?.userType.startsWith("host:")) { navigate("/dashboard");       return; }
    navigate("/properties");
  };
  
  return (
    <>
      <div className="w-full">
        <div
          data-scroll-section
          className="w-full min-h-[700px] z-30 py-40 relative flex items-center justify-center gap-8"
        >
          <img
            src="/hero.jpg"
            alt=""
            className="w-full h-full absolute z-20 object-cover"
          />
          <div className="w-full h-full absolute z-30 bg-[rgba(0,0,0,.5)]"></div>

          <div className="max-w-screen-xl py-12 md:py-20 mx-auto lg:px-4 z-40 flex md:items-center md:justify-center flex-col  gap-8 lg:gap-16  md:gap-12">
            <div className="flex max-w-[980px] md:mx-auto flex-col md:items-center justify-center gap-8">
              <div className="w-full hero_about_text flex-row flex items-center gap-4">
                <div className="flex items-center">
                  {profilesList?.map((face, index) => {
                    return (
                      <div
                        key={index}
                        className={`${
                          index !== 0 ? "-ml-6 " : ""
                        } w-10 md:w-10 h-10 md:h-10 border-[#fff] z-20 overflow-hidden rounded-full border-2`}
                      >
                        <img
                          src={face}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  })}
                </div>
                <span className="text-xs lg:text-sm text-[#eee] regular capitalize block family1">
                  5 K+ Happy Customers
                </span>
              </div>
              <h1 className="text-white hide w-full leading-[1.1] lg:leading-[1] text-3xl md:text-center sm:text-5xl lg:text-7xl family2">
                <span className="text-center hero_main_text bold hide">
                  Find your Best Property - By Lease, or Rent with Confidence
                </span>
                <span className="text-xs md:text-lg hero_submain_text hide max-w-[400px] lg:mx-auto md:text-center lg:max-w-[680px] text-gray-400  pt-2 block family1">
                  Explore a versed range of properties and secure your next
                  home. We are experts who set the pace Inspiring homes beyond
                  boundaries. We help you get the best out of your finance in
                  getting a home
                </span>
              </h1>
            </div>
            <div className="w-full md:w-[450px] md:items-center flex-row gap-4 flex">
              <div className="flex flex-1">
                <Link
                  to={"/search"}
                  className="btn hero_btn md:text-xs text-center  w-full text-xs family1 regular text-white rounded-[40px] px-4 py-4"
                >
                  Book Your Home
                </Link>
              </div>

              <div className="flex flex-1 items-center">
                <Link
                  to={"/search"}
                  className="btn hero_btn btn_2 md:text-xs text-center w-full text-xs family1 regular text-white px-4 py-4"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full">
          {/* <SearchHomes /> */}
        </div>
      </div>
      {/* <Sidebar bar={bar} setBar={setBar} currentUser={currentUser} /> */}
    </>
  );
};

export default Hero