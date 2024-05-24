"use client";
import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import moment from "moment";
import { MdArrowRightAlt } from "react-icons/md";
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
import Heart from "@/assets/svg/heart";

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
  const { loading, error, rooms } = useRooms();
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
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
              {apartmentDataList?.map((apartment, index) => {
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
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms?.map((apartment, index) => {
                const startDate = moment(apartment?.rooms?.startDate).format(
                  "MMMM Do"
                );

                 const endDate = moment(apartment?.rooms?.endDate).format(
                   "MMMM Do"
                 );
                return (
                  <Link
                    href={`booking/rooms/${apartment?.id}`}
                    key={index}
                    className="w-full flex flex-col"
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
                      className="w-full h-[300px] object-cover hover:grayscale-[1] grayscale-0"
                    />
                    <div className="w-full flex flex-col py-3 bg-white gap-2">
                      <div className="w-full flex items-center justify-between">
                        <h4
                          style={{ letterSpacing: "3px" }}
                          className="text-xs text-grey uppercase font-booking_font_bold font-bold"
                        >
                          for settling in castle
                        </h4>
                        <Heart />
                      </div>
                      <h3 className="text-2xl font-booking_font4 font-medium text-text_dark_1 ">
                        {apartment?.title}
                      </h3>

                      <div
                        style={{ letterSpacing: "3px" }}
                        className="py-2 flex items-center justify-between gap-2 pb-1  border-b border-[rgba(0,0,0,.6)] text-xs font-bold font-booking_font_bold"
                      >
                        <span className="flex uppercase items-center gap-2">
                          explore homes <MdArrowRightAlt />
                        </span>

                        <span className="flex text-xs text-grey font-normal font-booking_font flex-col">
                          price
                          <span className="block text-lg text-stone-950 font-bold font-booking_font_bold">
                            ${apartment?.price}
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
