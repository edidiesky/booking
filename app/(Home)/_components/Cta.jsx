"use client";
import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
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

export default function Cta() {
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

  const ctaText1 = "BENNETH HOUSE – COMFORTABLE AND SUSTAINABLE STYLE";
  const ctaText2 = "Seasonal Collections";
  const ctaText5 = "Wow-Worthy Collections";
  const ctaText6 = "For stays worth sharing";
  const ctaText3 =
    "For tropical explorations, beachfront connections, and cherished family vacations";
  const ctatext4 =
    "Welcome to LOVAT HOUSE BED & BREAKFAST, we are in Crieff, Perthshire in the heart of Strathearn, the start of the highlands. Relax in our calm and peaceful guest house and enjoy a great start to your day with our lovely fresh breakfast. We’re really looking forward to seeing you.";
  const ctatext1 =
    "I AM PASSIONATE ABOUT WEB TECHNOLOGIES AND ELECTRICAL ENGINEERING. I LOVE WORKING AT THE INTERSECTION OF CREATIVITY AND USER FRIENDLY INTERFACES . I CREATE MEMORABLE WEB EXPERIENCES.";

  const { loading, error, rooms } = useRooms();
  return (
    <div data-scroll className="py-32 w-full mt-20 z-50">
      <div className="w-[90%] mx-auto items-start m-auto max-w-custom  flex flex-col gap-4">
        <div className="w-full grid grid-cols-1 lg:grid-cols-custom gap-8 lg:gap-20">
          <div className="w-full">
            <h3
              ref={ctaText_1}
              className=" w-full text-5xl flex flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font4 font-medium text-text_dark_1 "
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
          </div>
          <div className="w-full lg:w-[600px] flex flex-col gap-24">
            <h5
              ref={ctaText_4}
              className=" w-full text-lg lg:text-lg flex flex-wrap gap-x-[8px] gap-y-[8px] md:gap-y-[4px]  leading-[1] font-portfolio_bold1 font-medium text-text_dark_1 "
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
        <div className="w-full mt-20 md:mt-24 flex flex-col gap-20">
          <div className="w-full  grid grid-cols-1 sm:grid-cols-1 gap-4 ">
            <div className="w-full">
              <h4
                ref={ctaText_5}
                className=" w-full text-5xl lg:text-6xl flex flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font4 font-medium text-text_dark_1 "
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
              </h4>
            </div>
            <div className="w-full flex flex-col gap-24">
              <h4
                ref={ctaText_6}
                className=" w-full text-lg lg:text-lg flex flex-wrap gap-x-[8px] gap-y-[8px] md:gap-y-[4px]  leading-[1] font-portfolio_bold1 font-medium text-text_dark_1 "
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
            <div className="w-full  grid grid-cols-1 md:grid-cols-2 gap-2">
              <Skeleton width={"100%"} height={520} />
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
                {apartmentDataList?.slice(0, 4).map((apartment, index) => {
                  return <Skeleton key={index} width={"100%"} height={250} />;
                })}
              </div>
            </div>
          ) : (
            <div className="w-full  grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href={`/booking/rooms/${rooms[0]?._id}`}
                className="shadow rounded-2xl overflow-hidden w-full flex flex-col"
              >
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
                  src={rooms[0]?.images[0]}
                  className="w-full h-full hover:grayscale-[1] grayscale-0"
                />
                <div className="w-full flex flex-col p-6 py-8 bg-white">
                  <h3 className="text-lg font-booking_font2 font-medium text-text_dark_1 ">
                    {rooms[0]?.title}
                  </h3>
                </div>
              </Link>
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms?.slice(0, 4).map((apartment, index) => {
                  return (
                    <Link
                      href={`booking/rooms/${apartment?._id}`}
                      key={index}
                      className="shadow rounded-2xl overflow-hidden w-full flex flex-col"
                    >
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
                        src={apartment?.images[0]}
                        className="w-full h-full object-cover hover:grayscale-[1] grayscale-0"
                      />
                      <div className="w-full flex flex-col p-6 bg-white">
                        <h3 className="text-xl font-booking_font_bold font-medium text-text_dark_1 ">
                          {apartment?.title}
                        </h3>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* 2nd apartment */}
        <div className="w-full mt-36 md:mt-40 flex flex-col gap-20">
          <div className="w-full  grid grid-cols-1 sm:grid-cols-1 gap-2">
            <div className="w-full">
              <h4
                ref={ctaText_7}
                className=" w-full text-5xl lg:text-6xl flex flex-wrap gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font4 font-medium text-text_dark_1 "
              >
                {ctaText5.split(" ").map((x, index) => {
                  return (
                    <span key={index} className="inline-flex hide relative">
                      <motion.span
                        variants={slideup2}
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
            <div className="w-full flex flex-col gap-24">
              <h4
                ref={ctaText_8}
                className=" w-full text-lg lg:text-lg flex flex-wrap gap-x-[8px] gap-y-[8px] md:gap-y-[4px]  leading-[1] font-portfolio_bold1 font-medium text-text_dark_1 "
              >
                {ctaText6.split(" ").map((x, index) => {
                  return (
                    <span key={index} className="inline-flex hide relative">
                      <motion.span
                        variants={slideup}
                        custom={index}
                        initial="initial"
                        animate={inView3 ? "animate" : "exit"}
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
            <div className="w-full  grid grid-cols-1 md:grid-cols-2 gap-2">
              <Skeleton width={"100%"} height={520} />
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
                {rooms?.slice(0, 4).map((apartment, index) => {
                  return <Skeleton key={index} width={"100%"} height={250} />;
                })}
              </div>
            </div>
          ) : (
            <div className="w-full grid  grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href={`/booking/rooms/${rooms[1]?._id}`}
                className="shadow rounded-2xl overflow-hidden w-full flex flex-col"
              >
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
                  src={rooms[1]?.images[0]}
                  className="w-full h-full hover:grayscale-[1] grayscale-0"
                />
                <div className="w-full flex flex-col p-6 py-8 bg-white">
                  <h3 className="text-xl font-booking_font_bold font-medium text-text_dark_1 ">
                    {rooms[1]?.title}
                  </h3>
                </div>
              </Link>
              <div className="w-full grid md:grid-cols-2 gap-4">
                {rooms?.slice(1, 5).map((apartment, index) => {
                  return (
                    <Link
                      href={`booking/rooms/${apartment?._id}`}
                      key={index}
                      className="shadow rounded-2xl overflow-hidden w-full flex flex-col"
                    >
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
                        src={apartment?.images[0]}
                        className="w-full h-full object-cover hover:grayscale-[1] grayscale-0"
                      />
                      <div className="w-full flex flex-col p-6 bg-white">
                        <h3 className="text-xl font-booking_font_bold font-medium text-text_dark_1 ">
                          {apartment?.title}
                        </h3>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
