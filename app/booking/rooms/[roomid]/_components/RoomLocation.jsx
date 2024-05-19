"use client";
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { slideup } from "@/constants/utils/framer";
export default function RoomLocation() {
  const ctaText_1 = useRef(null);
  const inView = useInView(ctaText_1, {
    margin: "0px 100px -50px 0px",
  });

  const ctaText1 = "Where it is located";
  return (
    <>
      <div className="w-full">
        <div className="w-[90%] mx-auto max-w-custom_2">
          <div className="w-full flex flex-col gap-8">
            <h3
              ref={ctaText_1}
              className="text-4xl md:text-5xl font-bold flex flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font2"
            >
              {ctaText1.split(" ").map((x, index) => {
                return (
                  <span key={index} className="inline-flex hide relative">
                    <motion.span
                      variants={slideup}
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
            <div className="w-full h-[500px] bg-[#fafafa] rounded-xl"></div>
          </div>
        </div>
      </div>
    </>
  );
}
