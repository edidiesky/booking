"use client";
import Image from "next/image";
import React, { useRef} from "react";
import {
  slideup,
  slideup2,
} from "@/constants/utils/framer";
import { motion, useInView } from "framer-motion";
import { apartmentDataList } from "@/constants/data/apartment";
import Skeleton from "react-loading-skeleton";
import useGetUserReservation from "@/app/hooks/useGetUserReservation";
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

  const ctaText1 = "My Trips";
  const ctatext4 =
    "This page provides a list of all your placed home reservations";

  const { loading, error, rooms } = useGetUserReservation();
  return (
    <div data-scroll className="py-20 w-full z-50">
      <div className="w-[90%] mx-auto m-auto max-w-custom  flex flex-col gap-4">
        <div className="w-full grid grid-cols-1 gap-2">
          <h3
            ref={ctaText_1}
            className=" w-full text-5xl md:text-6xl flex flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1.4] font-booking_font4 font-medium text-text_dark_1 "
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
          <div className="w-full lg:w-[600px] flex flex-col gap-24">
            <h5
              ref={ctaText_4}
              className=" w-full text-sm flex flex-wrap gap-[8px] leading-[1] font-portfolio_bold1 font-medium text-text_dark_1 "
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
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    type={"trips"}
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
