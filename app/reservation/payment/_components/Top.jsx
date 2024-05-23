"use client";
import React, { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence, Variant } from "framer-motion";
import {
  opacity,
  slideup,
  smallslideup,
  slideup2,
} from "@/constants/utils/framer";
import RoomTitleAndDescription from "./RoomTitleAndDescription";
import RoomPaymentTab from "./RoomPaymentTab";
import { BiCheck, BiChevronLeft } from "react-icons/bi";
export default function RoomInfo() {
  const [datemodal, setDateModal] = useState(false);
  const [guestsmodal, setGuestsModal] = useState(false);

  // data for filtering
  const [childrens, setChildrens] = useState(1);
  const [adults, setAdults] = useState(2);

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
    console.log(selectedStartDate, selectedendDate, ranges);

    setDateRange({
      ...dateRange,
      selection: {
        startDate: selectedStartDate,
        endDate: selectedendDate,
      },
    });
  };

  const ctaText_1 = useRef(null);
  const ctaText_2 = useRef(null);

  const inView = useInView(ctaText_1, {
    margin: "0px 100px -50px 0px",
  });
  const inView2 = useInView(ctaText_2, {
    margin: "0px 100px -50px 0px",
  });
  const ctaText1 = "You are almost there!";
  const ctaText2 = "Book your Home with confidence";
  return (
    <>
      <div className="w-full py-20 flex flex-col gap-24 justify-end items-end">
        <div className="w-[90%] relative md:w-[80%] mx-auto max-w-custom_1 justify-end items-end flex flex-col">
          <div className="w-full flex flex-col gap-20 justify-end">
            <div className="w-full grid grid-cols-1 lg:grid-cols-custom_5 gap-20">
              <div className="flex flex-col gap-12 w-full">
                {/* description */}
                <div className="w-full flex flex-col gap-8">
                  <div className="w-full flex flex-col md:flex-row md:items-center gap-4 md:px-4">
                    <div className="w-8 md:-ml-8 h-8 bg-[#d8d8d8] rounded-full flex items-center justify-center text-xl">
                      <BiChevronLeft />
                    </div>
                    <h2
                      ref={ctaText_1}
                      className="text-4xl lg:text-5xl font-normal font-booking_font4 flex flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font3"
                    >
                      {ctaText1.split(" ").map((x, index) => {
                        return (
                          <span
                            key={index}
                            className="inline-flex hide relative"
                          >
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
                    </h2>
                  </div>
                  <ul className="flex flex-col gap-8 pb-8 border-b">
                    <li className="text-lg font-booking_font font-normal">
                      Did you know that Marriott Bonvoy members earn 5 points
                      per qualifying $1 spent on every home stay? Join now and
                      start earning today.
                    </li>
                  </ul>
                </div>
                {/* payment features */}
                <div className="w-full flex flex-col gap-8">
                  <h2
                    ref={ctaText_2}
                    className="text-3xl lg:text-4xl font-normal flex font-booking_font4 flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font3"
                  >
                    {ctaText2.split(" ").map((x, index) => {
                      return (
                        <span key={index} className="inline-flex hide relative">
                          <motion.span
                            variants={slideup}
                            custom={index}
                            initial="initial"
                            animate={inView2 ? "animate" : "exit"}
                          >
                            {x}
                          </motion.span>
                        </span>
                      );
                    })}
                  </h2>
                  <ul className="flex flex-col gap-4 pb-12 border-b">
                    <li className="text-base flex items-center gap-2 font-booking_font font-normal">
                      <BiCheck fontSize={"24px"} /> All homes are hosted by a
                      property management company
                    </li>

                    <li className="text-base flex items-center gap-2 font-booking_font font-normal">
                      <BiCheck fontSize={"24px"} /> Every home has been curated
                      by our team
                    </li>
                    <li className="text-base flex items-center gap-2 font-booking_font font-normal">
                      <BiCheck fontSize={"24px"} /> 24/7 guest support is
                      included with every stay
                    </li>
                  </ul>
                </div>
                <div className="w-full flex flex-col gap-4">
                  <span className="text-sm font-booking_font font-normal">
                    All fees and charges will be inclusive of taxes. Exceptions
                    may apply in certain jurisdictions. For a list of
                    exceptions, please click{" "}
                    <span className="font-bold">here.</span>
                  </span>

                  <div className="btn p-6 cursor-pointer px-8 text-base font-bold uppercase text-center rounded-lg text-white font-booking_font">
                    pay now
                  </div>
                </div>
              </div>
              <div className="w-full sticky top-[10%] lg:w-[420px] flex flex-col gap-16">
                <RoomPaymentTab
                  setAdults={setAdults}
                  datemodal={datemodal}
                  setDateModal={setDateModal}
                  handleSelect={handleSelect}
                  dateRange={dateRange}
                  adults={adults}
                  setChildrens={setChildrens}
                  childrens={childrens}
                  guestsmodal={guestsmodal}
                  setGuestsModal={setGuestsModal}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
