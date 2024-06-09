"use client";
import React from "react";
import RoomCard from "@/components/common/RoomCard";
import Image from "next/image";
import useRooms from "@/app/hooks/useRooms";
import Footer from "@/components/common/Footer";
import Newsletter from "@/components/common/Newsletter";
import Hero from "./Hero";
import Skeleton from "react-loading-skeleton";
import { apartmentDataList } from "@/constants/data/apartment";
export default function HomeIndex() {
  return (
    <div className="w-full">
      <Hero />
      <div className="grid py-8 min-h-[70vh] p-6 bg-[#fafafa] w-full">
        <RoomLists />
      </div>
      <Newsletter />
      <Footer />
    </div>
  );
}

const RoomLists = () => {
  const { loading, error, rooms } = useRooms();
  return (
    <div
      className="w-full relative py-24 flex items-center justify-center
   gap-8"
    >
      <div
        className="w-[90%] relative mx-auto max-w-custom_1 z-40 grid md:grid-cols-custom_4 items-start justify-center flex-col
       gap-12"
      >
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
        <div className="w-full">
          <div className=" gap-8 w-full grid md:grid-cols-2">
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
                {rooms?.slice(0, 6)?.map((apartment, index) => {
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
    </div>
  );
};
