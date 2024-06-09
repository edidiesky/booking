"use client";
import React, { useRef, useState } from "react";
import { slideup, slideup2 } from "@/constants/utils/framer";
import { motion, useInView } from "framer-motion";
import { apartmentDataList } from "@/constants/data/apartment";
import Skeleton from "react-loading-skeleton";
import useGetUserRoomsFavourites from "@/app/hooks/useGetUserRoomsFavourites";
import RoomCard from "@/components/common/RoomCard";

export default function Cta({ currentUser }) {
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
  const { loading, rooms } = useGetUserRoomsFavourites();

  return (
    <>
      <Hero />
      <div data-scroll className="py-20 w-full z-50">
        <div className="w-[90%] mx-auto m-auto max-w-custom flex items-center justify-center flex-col gap-4">
       
          <div className="w-full mt-16 flex flex-col gap-20">
            {loading ? (
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                {apartmentDataList?.map((apartment, index) => {
                  return (
                    <div className="w-full flex flex-col gap-2">
                      <Skeleton key={index} width={"100%"} height={300} />
                      <Skeleton key={index} width={"30%"} height={10} />
                      <Skeleton key={index} width={"60%"} height={30} />
                      <Skeleton key={index} width={"30%"} height={10} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms?.map((apartment, index) => {
                  return (
                    <RoomCard
                      currentUser={currentUser}
                      apartment={apartment}
                      index={index}
                      key={index}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const Hero = () => {
  return (
    <div
      className="w-full min-h-[47vh] py-32 relative flex items-center justify-center
   gap-8"
    >
      <div className="w-full h-full z-30 bg-[rgba(0,0,0,.6)] absolute top-0 left-0"></div>
      <img
        src="/images/hazel_8.jpeg"
        alt=""
        className="absolute z-10 object-cover top-0 left-0 h-full w-full"
      />
      <div
        className="w-[90%] mx-auto z-40 flex items-center justify-center flex-col
       gap-4"
      >
        <h1 className="text-white text-center leading-[1.3] text-5xl md:text-6xl font-booking_font4">
          Saved Rooms
        </h1>
        <div className="w-full absolute bottom-0 left-0 z-[35] flex items-center justify-center py-8">
          <div className="w-[90%] lg:w-[50%] mx-auto grid grid-cols-2  sm:grid-cols-4 items-center justify-center gap-4 max-w-custom_1 h-full">
            <span
              style={{ letterSpacing: "4px" }}
              className="text-[9px] md:text-xs font-normal uppercase flex items-center gap-4 font-booking_font"
            >
              <div className="w-6 h-6 rounded-full bg-white text-dark flex items-center justify-center">
                1
              </div>{" "}
              <span className="text-white">Saved Room</span>
            </span>

            <span
              style={{ letterSpacing: "4px" }}
              className="text-[9px] md:text-xs font-normal uppercase flex items-center gap-4 font-booking_font"
            >
              <div className="w-6 h-6 rounded-full border-white border text-white flex items-center justify-center">
                2
              </div>{" "}
              <span className="text-white">BOOKING</span>
            </span>

            <span
              style={{ letterSpacing: "4px" }}
              className="text-[9px] md:text-xs font-normal uppercase flex items-center gap-4 font-booking_font"
            >
              <div className="w-6 h-6 rounded-full border-white border text-white flex items-center justify-center">
                3
              </div>{" "}
              <span className="text-white">CHECKOUT</span>
            </span>

            <span
              style={{ letterSpacing: "4px" }}
              className="text-[9px] md:text-xs font-normal uppercase flex items-center gap-4 font-booking_font"
            >
              <div className="w-6 h-6 rounded-full border-white border text-white flex items-center justify-center">
                4
              </div>{" "}
              <span className="text-white">THANK YOU</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
