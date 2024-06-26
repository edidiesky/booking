"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { apartmentDataList } from "@/constants/data/apartment";
import { motion, useInView } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import useRooms from "@/app/hooks/useRooms";
import { slideup, slideup2, slideup3 } from "@/constants/utils/framer";
const destinationsList = [
  {
    image:
      "https://homes-and-villas.marriott.com/assets/images/top-destination1_v17.png",
    title: "Big Bear Lake",
    subTitle: "Mountain Sky Resorts",
  },
  {
    image:
      "https://homes-and-villas.marriott.com/assets/images/top-destination2_v17.png",
    title: "Hawaii",
    subTitle: "Paradise gateWay",
  },
  {
    image:
      "https://homes-and-villas.marriott.com/assets/images/top-destination3_v17.png",
    title: "Miami",
    subTitle: "Coastal beach awaits",
  },
  {
    image:
      "https://homes-and-villas.marriott.com/assets/images/top-destination4_v17.png",
    title: "New Orleans",
    subTitle: "Live Music nightlife",
  },
  {
    image:
      "https://homes-and-villas.marriott.com/assets/images/top-destination5_v17.png",
    title: "Palm Springs",
    subTitle: "Golden Desert Charms",
  },
  {
    image:
      "https://homes-and-villas.marriott.com/assets/images/top-destination6_v17.png",
    title: "Playa Del Carmen",
    subTitle: "Beach gateway",
  },
  {
    image:
      "https://homes-and-villas.marriott.com/assets/images/top-destination7_v17.png",
    title: "London",
    subTitle: "City Break",
  },
  {
    image:
      "https://homes-and-villas.marriott.com/assets/images/top-destination8_v17.png",
    title: "Costa Rica",
    subTitle: "Pre Biza Biza",
  },
];

const assuranceList = [
  {
    image:
      "https://homes-and-villas.marriott.com/assets/images/value-expertly-curated.svg",
    title: "Trusted Standards",
    description: "Private homes that are professionally cleaned & inspected.",
  },
  {
    image:
      "https://homes-and-villas.marriott.com/assets/images/value-trusted-hospitality.svg",
    title: "Worry-Free Travel",
    description:
      "Travel lighter with 24/7 support, seamless arrivals, and premium home essentials.",
  },
  {
    image:
      "https://homes-and-villas.marriott.com/assets/images/value-unparalleled-loyalty.svg",
    title: "Unparalleled Loyalty",
    description:
      "Earn and redeem Marriott Bonvoy points on summer vacation homes.",
  },
];
const Work = () => {
  const ctaText_1 = useRef(null);
  const ctaText_2 = useRef(null);
  const ctaText_3 = useRef(null);
  const ctaText_4 = useRef(null);
  const ctaText_5 = useRef(null);
  const container = useRef(null);
  const container2 = useRef(null);
  const container3 = useRef(null);
  const inView = useInView(ctaText_1, {
    margin: "0px 100px -50px 0px",
  });
  const inView4 = useInView(ctaText_3, {
    margin: "0px 100px -50px 0px",
  });
  const inView5 = useInView(ctaText_4, {
    margin: "0px 100px -50px 0px",
  });
  const inView6 = useInView(container2, {
    margin: "0px 80px -50px 0px",
  });
  const inView7 = useInView(ctaText_5, {
    margin: "0px 80px -50px 0px",
  });
  const inView8 = useInView(container3, {
    margin: "0px 80px -50px 0px",
  });
  const inView3 = useInView(container, {
    margin: "0px 100px -50px 0px",
  });
  const inView2 = useInView(ctaText_2, {
    margin: "0px 100px -50px 0px",
  });
  const ctaText2 = "Popular Destinations";
  const ctaText5 = "Private Homes With The Assurances Of Marriott";
  const ctaText3 =
    "Check of some of our popular destinations selected by individuals";
  const ctatext4 =
    "We offer a selection of teas from the Wee tea company and coffee pods, in the bathroom you will find luxurious towels alongside gorgeous locally handmade soaps, but you should come and see for yourself and enjoy your time at Lovat House Bed and Breakfast.";
  // console.log(apartmentDataList?.slice(4,7))
  return (
    <>
      <div data-scroll className="w-full relative">
        <div className="bg-white w-full py-24 flex flex-col gap-12">
          <div className="bg-[#f5f5f5] w-full py-32 flex flex-col items-center justify-center">
            <div className="w-[90%] grid gap-24 m-auto max-w-custom">
              <div className=" md:w-[80%] mx-auto flex flex-col items-center gap-8 justify-center">
                <div className="w-[full]">
                  <h4
                    ref={ctaText_5}
                    className="w-full text-4xl md:text-6xl flex flex-wrap md:justify-center md:items-center gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font4 font-medium text-text_dark_1 "
                  >
                    {ctaText5.split(" ").map((x, index) => {
                      return (
                        <span key={index} className="inline-flex hide relative">
                          <motion.span
                            variants={slideup2}
                            custom={index}
                            initial="initial"
                            animate={inView7 ? "animate" : "exit"}
                          >
                            {x}
                          </motion.span>
                        </span>
                      );
                    })}
                  </h4>
                </div>
              </div>
              <div
                ref={container3}
                className="w-full grid hide grid-cols-1 md:grid-cols-3"
              >
                {assuranceList?.map((data, index) => {
                  return (
                    <motion.div
                      key={index}
                      variants={slideup3}
                      custom={index}
                      initial="initial"
                      animate={inView8 ? "animate" : "exit"}
                      className="cursor-pointer hide rounded-lg p-12 px-6 
                      border-b md:border-b-0 border-r-0 md:border-r-2
                       border-[#D4AF37] flex flex-col
                        justify-center items-center gap-8"
                    >
                      <Image
                        alt="Cotion"
                        width={0}
                        sizes="100vw"
                        height={0}
                        loading="lazy"
                        src={data.image}
                        className="w-24 h-24"
                      />
                      <h4 className="text-2xl flex-1 leading-[1] text-center font-bold font-booking_font2">
                        {data.title}
                        <span className="block pt-6 text-base w-[80%] mx-auto text-center leading-[1.6] font-booking_font_normal">
                          {data.description}
                        </span>
                      </h4>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="w-[90%] py-32 md:w-[80%] flex flex-col gap-16 m-auto max-w-custom">
            <div className="w-full flex flex-col gap-2">
              <div className="w-[full]">
                <h3
                  ref={ctaText_3}
                  className=" w-full text-4xl md:text-5xl flex flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font4 font-medium text-text_dark_1 "
                >
                  {ctaText2.split(" ").map((x, index) => {
                    return (
                      <span key={index} className="inline-flex hide relative">
                        <motion.span
                          // variants={slideup2}
                          custom={index}
                          initial="initial"
                          // animate={inView4 ? "animate" : "exit"}
                        >
                          {x}
                        </motion.span>
                      </span>
                    );
                  })}
                </h3>
              </div>
              <div className="w-full flex flex-col gap-24">
                <h4
                  ref={ctaText_4}
                  className="w-full text-xl lg:text-lg flex flex-wrap md:items-center  gap-x-[8px] gap-y-[4px]  leading-[1] font-portfolio_bold1 font-medium text-text_dark_1 "
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
            <div ref={container2} className="w-full grid gap-x-8 gap-y-4">
              {/* {destinationsList?.map((data, index) => {
                return (
                  <motion.div
                    key={index}
                    variants={slideup3}
                    custom={index}
                    initial="initial"
                    animate={inView6 ? "animate" : "exit"}
                    className="cursor-pointer border rounded-lg bg-white flex items-center gap-4"
                  >
                    <Image
                      alt="Cotion"
                      width={0}
                      sizes="100vw"
                      height={0}
                      loading="lazy"
                      src={data.image}
                      className="w-24 h-24"
                    />
                    <h4 className="text-lg flex-1 leading-[1] font-bold font-booking_font2">
                      {data.title}
                      <span className="block pt-2 text-xs leading-[1.2] font-booking_font4 font-normal text-grey">
                        {data.subTitle}
                      </span>
                    </h4>
                  </motion.div>
                );
              })} */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Work;
