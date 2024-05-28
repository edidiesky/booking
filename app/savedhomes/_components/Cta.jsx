"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  slideup,
  slideup2,
} from "@/constants/utils/framer";
import { motion, useInView } from "framer-motion";
import useRooms from "@/app/hooks/useRooms";
import RoomCard from "@/components/common/RoomCard";

export default function Cta() {
  const [savedrooms, setSavedRooms] = useState([]);
  const ctaText_1 = useRef(null);
  const ctaText_4 = useRef(null);
  const inView = useInView(ctaText_1, {
    margin: "0px 100px -50px 0px",
  });
  const inView4 = useInView(ctaText_4, {
    margin: "0px 100px -50px 0px",
  });

  const ctaText1 = "Saved Homes";
  const ctatext4 =
    "Don't see your saved homes? Our site uses cookies to track your saved homes and they aren't shared across different devices, so try visiting us again from your original device.";
  const { loading, error, rooms } = useRooms();
 let savedroomsInLocalStorage = JSON.parse(localStorage.getItem("savedRooms"));
  useEffect(() => {
    let savedroomsInLocalStorage = JSON.parse(
      localStorage.getItem("savedRooms")
    );
    if (savedroomsInLocalStorage) {
      setSavedRooms(savedroomsInLocalStorage);
    }
  }, [setSavedRooms]);
  return (
    <div data-scroll className="py-20 w-full z-50">
      <div className="w-[90%] mx-auto max-w-custom_2 flex flex-col gap-4">
        <div className="w-full grid grid-cols-1 gap-8">
          <h3
            ref={ctaText_1}
            className=" w-full text-6xl flex flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font4 font-medium text-text_dark_1 "
          >
            {ctaText1.split(" ").map((x, index) => {
              return (
                <span key={index} className="inline-flex hide relative">
                  <motion.span
                    variants={slideup2}
                    custom={index}
                    initial="initial"
                    animate={inView ? "animate" : "exit"}
                  >
                    {x}
                  </motion.span>
                </span>
              );
            })}
          </h3>
          <div className="w-[60%] flex flex-col">
            <h5
              ref={ctaText_4}
              className=" w-full text-base flex flex-wrap gap-[4px] leading-[1] font-portfolio_bold1 font-medium text-text_dark_1 "
            >
              {ctatext4.split(" ").map((x, index) => {
                return (
                  <span key={index} className="inline-flex hide relative">
                    <motion.span
                      variants={slideup}
                      custom={index}
                      initial="initial"
                      animate={inView4 ? "animate" : "exit"}
                    >
                      {x}
                    </motion.span>
                  </span>
                );
              })}
            </h5>
          </div>
        </div>
        {/* 1st apartment */}
        <div className="w-full mt-16 flex flex-col gap-20">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedrooms?.map((apartment, index) => {
              const includedInSavedRooms =
                savedroomsInLocalStorage?.includes(apartment);
              return (
                <RoomCard
                  apartment={apartment}
                  index={index}
                  includedInSavedRooms={includedInSavedRooms}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
