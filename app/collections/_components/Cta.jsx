"use client";
import React, { useRef, useState, useEffect } from "react";
import { slideup, slideup2 } from "@/constants/utils/framer";
import { BiCheck, BiChevronDown, BiChevronUp } from "react-icons/bi";
import { motion, useInView } from "framer-motion";
import { apartmentDataList } from "@/constants/data/apartment";
import Skeleton from "react-loading-skeleton";
import useRooms from "@/app/hooks/useRooms";
import RoomCard from "@/components/common/RoomCard";

export default function Cta({ currentUser }) {
  const ctaText_1 = useRef(null);
  const ctaText_4 = useRef(null);
  const inView = useInView(ctaText_1, {
    margin: "0px 100px -50px 0px",
  });
  const inView4 = useInView(ctaText_4, {
    margin: "0px 100px -50px 0px",
  });

  const ctaText1 = "Curated Collections";
  const ctatext4 =
    "We've hand-picked the most inspirational and interesting homes from around the world in our Curated Collections. Start exploring and 'heart' your favorites to your 'Saved Homes' list.";

  const { loading, error, rooms } = useRooms();

  return (
    <div data-scroll className="py-20 w-full z-50">
      <div className="w-[90%] mx-auto m-auto max-w-custom  grid md:grid-cols-custom_4 items-start  justify-center gap-4">
        <div className="w-[90%] sticky top-[11%] flex flex-col gap-8">
          <div className="w-full py-12 flex items-center justify-center md:w-[400px] bg-[#1C1C1C]">
            <div className="w-[90%] mx-auto grid grid-cols-2 gap-4">
              <div className="py-8 cursor-pointer bg-[#151515] flex items-center justify-center flex-col gap-4">
                <span className="uppercase text-sm text-white">CHECK-IN</span>
                <div className="flex items-center gap-2">
                  <span
                    style={{ letterSpacing: "4px" }}
                    className="text-2xl text-[var(--gold-1)] pt-3 md:text-6xl block font-booking_font4 uppercase leading-[1.5] text-center text-dark"
                  >
                    19
                  </span>
                  <span
                    style={{ letterSpacing: "4px" }}
                    className="text-[8px] text-[var(--gold-1)] md:text-xs uppercase leading-[1.5] flex flex-col text-dark font-normal"
                  >
                    JUN
                    <BiChevronDown fontSize={"24px"} />
                  </span>
                </div>
              </div>
              <div className="py-8 cursor-pointer bg-[#151515] flex items-center justify-center flex-col gap-4">
                <span className="uppercase text-sm text-white">CHECK-Out</span>
                <div className="flex items-center gap-2">
                  <span
                    style={{ letterSpacing: "4px" }}
                    className="text-2xl text-[var(--gold-1)] pt-3 md:text-6xl block font-booking_font4 uppercase leading-[1.5] text-center text-dark"
                  >
                    19
                  </span>
                  <span
                    style={{ letterSpacing: "4px" }}
                    className="text-[8px] text-[var(--gold-1)] md:text-xs uppercase leading-[1.5] flex flex-col text-dark font-normal"
                  >
                    JUN
                    <BiChevronDown fontSize={"24px"} />
                  </span>
                </div>
              </div>
              <div className="py-8 cursor-pointer bg-[#151515] flex items-center justify-center flex-col gap-4">
                <span className="uppercase text-sm text-white">GUEsTS</span>
                <div className="flex items-center gap-2">
                  <span
                    style={{ letterSpacing: "4px" }}
                    className="text-2xl text-[var(--gold-1)] pt-3 md:text-6xl block font-booking_font4 uppercase leading-[1.5] text-center text-dark"
                  >
                    19
                  </span>
                  <span
                    style={{ letterSpacing: "4px" }}
                    className="text-[8px] text-[var(--gold-1)] md:text-xs uppercase leading-[1.5] flex flex-col text-dark font-normal"
                  >
                    <BiChevronDown fontSize={"24px"} />
                    <BiChevronUp fontSize={"24px"} />
                  </span>
                </div>
              </div>
              <div className="py-8 cursor-pointer bg-[#151515] flex items-center justify-center flex-col gap-4">
                <span className="uppercase text-sm text-white">Nights</span>
                <div className="flex items-center gap-2">
                  <span
                    style={{ letterSpacing: "4px" }}
                    className="text-2xl text-[var(--gold-1)] pt-3 md:text-6xl block font-booking_font4 uppercase leading-[1.5] text-center text-dark"
                  >
                    19
                  </span>
                  <span
                    style={{ letterSpacing: "4px" }}
                    className="text-[8px] text-[var(--gold-1)] md:text-xs uppercase leading-[1.5] flex flex-col text-dark font-normal"
                  >
                    <BiChevronDown fontSize={"24px"} />
                    <BiChevronUp fontSize={"24px"} />
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="py-8 border-t border-b px-4 w-full text-xl">
            <div className="flex items-center justify-between w-full">
              <h4 className="font-booking_font4">Maximum Price:</h4>
              <h4 className="font-booking_font4">$199</h4>
            </div>
          </div>
        </div>
        {/* 1st apartment */}
        <div className="w-full flex flex-col gap-20">
          {loading ? (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
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
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
              {rooms?.map((apartment, index) => {
                return (
                  <RoomCard
                    type={"Search"}
                    currentUser={currentUser}
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
