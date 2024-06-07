"use client";
import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { MdArrowRightAlt } from "react-icons/md";
import axios from "axios";
import {
  opacity,
  slideup,
  smallslideup,
  slideup2,
} from "@/constants/utils/framer";
import { motion, useInView } from "framer-motion";
import { apartmentDataList } from "@/constants/data/apartment";
import Skeleton from "react-loading-skeleton";
import useRooms from "@/app/hooks/useRooms";
import RoomCard from "@/components/common/RoomCard";

export default function Cta({ currentUser }) {
  const ctaText_1 = useRef(null);
  const ctaText_2 = useRef(null);
  const ctaText_3 = useRef(null);
  const ctaText_4 = useRef(null);
  const ctaText_5 = useRef(null);
  const ctaText_6 = useRef(null);
  const ctaText_7 = useRef(null);
  const ctaText_8 = useRef(null);
  const inView = useInView(ctaText_1, {
    margin: "0px 100px -50px 0px",
  });
  const inView4 = useInView(ctaText_4, {
    margin: "0px 100px -50px 0px",
  });
  const inView2 = useInView(ctaText_7, {
    margin: "0px 100px -50px 0px",
  });
  const inView3 = useInView(ctaText_8, {
    margin: "0px 100px -50px 0px",
  });
  const inView6 = useInView(ctaText_5, {
    margin: "0px 100px -50px 0px",
  });
  const inView5 = useInView(ctaText_6, {
    margin: "0px 100px -50px 0px",
  });

  const ctaText2 = "Our Seasonal Collections";
  const ctaText3 =
    "Welcome to LOVAT HOUSE BED & BREAKFAST, we are in Crieff, Perthshire in the heart of Strathearn, the start of the highlands. Relax in our calm and peaceful guest house and enjoy a great start to your day with our lovely fresh breakfast. We’re really looking forward to seeing you.";

  const { loading, error, rooms } = useRooms();
  return (
    <div data-scroll className="py-32 w-full z-50">
      <div className="w-[90%] md:w-[80%] mx-auto items-start m-auto max-w-custom  flex flex-col gap-4">
        <div className="w-full flex flex-col gap-20">
          <div className="w-full  grid grid-cols-1 gap-8 ">
            <div className="w-full">
              <h2
                ref={ctaText_5}
                className=" w-full text-5xl lg:text-6xl flex md:items-center md:justify-center flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font4 font-medium text-text_dark_1 "
              >
                {ctaText2.split(" ").map((x, index) => {
                  return (
                    <span key={index} className="inline-flex hide relative">
                      <motion.span
                        variants={slideup2}
                        custom={index}
                        initial="initial"
                        animate={inView6 ? "animate" : "exit"}
                      >
                        {x}
                      </motion.span>
                    </span>
                  );
                })}
              </h2>
            </div>
            <div className="w-full flex flex-col gap-24">
              <h4
                ref={ctaText_6}
                className=" w-full md:w-[600px] md:mx-auto text-lg lg:text-base flex md:items-center
                 md:justify-center flex-wrap gap-x-[8px] gap-y-[8px] 
                 md:gap-y-[4px]  leading-[1] font-booking_font_normal text-text_dark_1 "
              >
                {ctaText3.split(" ").map((x, index) => {
                  return (
                    <span key={index} className="inline-flex hide relative">
                      <motion.span
                        variants={slideup}
                        custom={index}
                        initial="initial"
                        animate={inView5 ? "animate" : "exit"}
                      >
                        {x}
                      </motion.span>
                    </span>
                  );
                })}
              </h4>
            </div>
          </div>
          {loading ? (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
              {apartmentDataList?.slice(0, 6).map((apartment, index) => {
                return (
                  <div key={index} className="w-full flex flex-col gap-2">
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
              {rooms?.slice(0,4)?.map((apartment, index) => {
                return (
                  <RoomCard
                    index={index}
                    apartment={apartment}
                    currentUser={currentUser}
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
