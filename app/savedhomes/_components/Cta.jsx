"use client";
import React, { useRef, useState} from "react";
import {
  slideup,
  slideup2,
} from "@/constants/utils/framer";
import { motion, useInView } from "framer-motion";
import { apartmentDataList } from "@/constants/data/apartment";
import Skeleton from "react-loading-skeleton";
import useGetUserRoomsFavourites from "@/app/hooks/useGetUserRoomsFavourites";
import RoomCard from "@/components/common/RoomCard";

export default function Cta() {
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
          {loading ? (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
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
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
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
  );
}
