"use client";
import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  slideup
} from "@/constants/utils/framer";
import DateInput from "@/components/forms/DateInput";
export default function RoomCalendar() {
  const ctaText_1 = useRef(null);
  const inView = useInView(ctaText_1, {
    margin: "0px 100px -50px 0px",
  });

  const ctaText1 = "6 nights in Câmara de Lobos";

  const [dateRange, setDateRange] = useState({
    selection: {
      startDate: null,
      endDate: null,
      key: "selection",
    },
  });

  const handleSelect = (ranges) => {
    // console.log(ranges);
    const selectedStartDate = ranges?.range1?.startDate;
    const selectedendDate = ranges?.range1?.endDate;
    // console.log(selectedStartDate, selectedendDate, ranges);

    setDateRange({
      ...dateRange,
      selection: {
        startDate: selectedStartDate,
        endDate: selectedendDate,
        key: "selection",
      },
    });
  };
  return (
    <>
      <div className="w-full">
        <div className="w-[90%] mx-auto max-w-custom_2">
          <div className="w-full flex flex-col gap-8">
            <div className="w-full flex flex-col gap-4">
              <h3
                ref={ctaText_1}
                className="text-3xl font-bold flex flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font_normal"
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
              <span className="text-light font-normal text-lg font-booking_font1">
                Oct 16, 2024 - Oct 22, 2024
              </span>
            </div>
            <div className="w-full grid md:grid-cols-custom_5">
              <DateInput handleSelect={handleSelect} dateRange={dateRange} />
              <div className="w-[300px]"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
