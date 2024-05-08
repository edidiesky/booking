"use client";
import React, { useEffect, useRef, useState } from "react";
import { apartmentList } from "@/constants/data/apartment";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  opacity,
  slideup,
  smallslideup,
  slideup2,
  slideup3,
} from "@/constants/utils/framer";
export default function RoomBottom() {
  const ctaText_1 = useRef(null);
  const ctaText_2 = useRef(null);
  const ctaText1 = "Choose Rooms";
  // views
  const inView = useInView(ctaText_1, {
    margin: "0px 100px -50px 0px",
  });
  return (
    <>
      <div className="w-full py-20">
        <div className="px-4 w-[90%] mx-auto flex flex-col gap-16">
          <h4
            ref={ctaText_1}
            className=" w-full text-6xl lg:text-6xl flex flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font3 font-medium text-text_dark_1 "
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
          </h4>
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
            <div className="bg-white p-4 border-2 rounded-2xl">
              <div className="w-full flex flex-col gap-16">
                <Image
                  alt="Cotion"
                  width={0}
                  sizes="100vw"
                  height={0}
                  loading="lazy"
                  style={{
                    transition:
                      "filter 0.2s cubic-bezier(0.4, 0, 0.2, 1), -webkit-filter 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  src={apartmentList[0]?.images}
                  className="w-full hover:grayscale-[1] object-cover rounded-2xl grayscale-0 h-[180px]"
                />
                <div className="w-full flex flex-col gap-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
