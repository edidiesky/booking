"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  opacity,
  slideup,
  smallslideup,
  slideup2,
  slideup3,
} from "@/constants/utils/framer";

const apartmentList = [
  {
    images:
      "http://www.lovathouse-crieff.com/wp-content/uploads/2016/01/lovat-double_room-570x568.jpg",
    title: "DOUBLE ROOM",
    description:
      "Double room, on the ground floor with a generous ensuite with corner bath and shower over. Relax in comfort in Egyptian cotton sheets.",
    price: "100",
  },
  {
    images:
      "http://www.lovathouse-crieff.com/wp-content/uploads/2016/06/10m-1.jpg",
    title: "FAMILY ROOM",
    description:
      "Family room, nice and spacious with a double and single bed with the fabulous shower room. You won’t want to leave.",
    price: "70",
  },
];

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

  const ctaText1 = "LOVAT HOUSE BED & BREAKFAST";
  const ctaText2 = "Popular Destinations";
  const ctaText5 = "Private Homes With The Assurances Of Marriott";
  const ctaText3 =
    "Check of some of our popular destinations selected by individuals";
  const ctatext4 =
    "We offer a selection of teas from the Wee tea company and coffee pods, in the bathroom you will find luxurious towels alongside gorgeous locally handmade soaps, but you should come and see for yourself and enjoy your time at Lovat House Bed and Breakfast.";

  return (
    <>
      <div data-scroll className="pt-40 bg-[#F5F5F5] w-full relative">
        <div className="w-[90%] pb-24 m-auto max-w-custom relative flex flex-col gap-16">
          <div className="w-[80%] mx-auto flex flex-col items-center gap-4 justify-center">
            <div className="w-[full]">
              <h4
                ref={ctaText_1}
                className=" w-full text-6xl lg:text-7xl flex flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font3 font-medium text-text_dark_1 "
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
            </div>
            <div className="w-full flex flex-col gap-24">
              <h4
                ref={ctaText_2}
                className="w-full md:w-[80%] mx-0 md:mx-auto text-xl lg:text-lg flex flex-wrap md:items-center md:justify-center gap-x-[8px] gap-y-[7px] md:gap-y-[4px]  leading-[1] font-portfolio_bold1 font-medium text-text_dark_1 "
              >
                {ctatext4.split(" ").map((x, index) => {
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
              </h4>
            </div>
          </div>

          <div ref={container} className="w-full flex flex-col">
            {apartmentList?.map((apartment, index) => {
              return (
                <div key={index} className="w-full hide">
                  <motion.div
                    variants={slideup3}
                    custom={index}
                    initial="initial"
                    animate={inView3 ? "animate" : "exit"}
                    key={index}
                    className={`${
                      index % 2 === 0
                        ? "flex-col md:flex-row-reverse"
                        : "flex-col md:flex-row"
                    } w-full flex `}
                  >
                    <div className="w-full flex bg-white flex-col items-start justify-start p-16 md:p-20 md:justify-center gap-4">
                      <h3 className="text-5xl font-booking_font3 font-medium text-text_dark_1 ">
                        {apartment?.title}
                      </h3>
                      <h4 className="text-xl italic">
                        {apartment?.description}
                      </h4>
                      <h3 className="text-lg font-normal font-booking_font1">
                        Rates from{" "}
                        <span className="font-bold text-3xl">
                          £{apartment?.price}
                        </span>{" "}
                        per night
                      </h3>

                      <div className="p-4 mt-8 text-sm cursor-pointer uppercase bg-[#C5F244] px-8 rounded-[40px] font-bold text-dark">
                        Book Now
                      </div>
                    </div>
                    <div className="w-full cursor-pointer">
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
                        src={apartment?.images}
                        className="w-full hover:grayscale-[1] grayscale-0"
                      />
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white w-full py-24 flex flex-col gap-12">
          <div className=" w-[90%] flex flex-col gap-16 m-auto max-w-custom">
            <div className="w-full flex flex-col gap-2">
              <div className="w-[full]">
                <h4
                  ref={ctaText_3}
                  className=" w-full text-6xl lg:text-7xl flex flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font3 font-medium text-text_dark_1 "
                >
                  {ctaText2.split(" ").map((x, index) => {
                    return (
                      <span key={index} className="inline-flex hide relative">
                        <motion.span
                          variants={slideup2}
                          custom={index}
                          initial="initial"
                          animate={inView4 ? "animate" : "exit"}
                        >
                          {x}
                        </motion.span>
                      </span>
                    );
                  })}
                </h4>
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
            <div
              ref={container2}
              className="w-full grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-4"
            >
              {destinationsList?.map((data, index) => {
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
              })}
            </div>
          </div>
        </div>

        <div className="bg-white w-full py-24 flex flex-col items-center justify-center">
          <div className="w-[90%] flex flex-col gap-16 m-auto max-w-custom">
            <div className="w-[80%] mx-auto flex flex-col items-center gap-4 justify-center">
              <div className="w-[full]">
                <h4
                  ref={ctaText_5}
                  className=" w-full text-6xl lg:text-7xl flex flex-wrap md:justify-center md:items-center gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font3 font-medium text-text_dark_1 "
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
              className="w-full grid grid-cols-1 md:grid-cols-3"
            >
              {assuranceList?.map((data, index) => {
                return (
                  <motion.div
                    key={index}
                    variants={slideup3}
                    custom={index}
                    initial="initial"
                    animate={inView8 ? "animate" : "exit"}
                    className="cursor-pointer rounded-lg p-20 px-6 border-b md:border-b-0 border-r-0 md:border-r-2 border-[#D4AF37] bg-white flex flex-col justify-center items-center gap-8"
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
                      <span className="block pt-6 text-base w-[80%] mx-auto text-center leading-[1.6] font-booking_font4 font-light text-grey">
                        {data.description}
                      </span>
                    </h4>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Work;
