"use client";
import React, { useRef } from "react";
import { LuBedDouble, LuBedSingle } from "react-icons/lu";
import { FaBed } from "react-icons/fa6";
import Link from "next/link";
export default function RoomDetails() {
  return (
    <>
      <div className="w-full py-4 pb-20 flex flex-col gap-24">
        <div className="w-[95%] md:w-[90%] mx-auto max-w-custom_2 flex flex-col gap-2">
          <div className="w-full flex flex-col gap-4">
            <h2 className="text-3xl pb-4 border-b border-[rgba(0,0,0,.6)] font-bold">
              Home Details
            </h2>
            {/* beds */}
            <div className="w-full grid md:grid-cols-2 gap-16">
              <div className="w-full pt-4 grid grid-cols-1 gap-y-8">
                <div className="w-full flex flex-col gap-2">
                  <h2
                    style={{ letterSpacing: "4px" }}
                    className="text-xl font-booking_font_normal pb-1 border-b uppercase font-medium"
                  >
                    BEDS & BATH
                  </h2>
                  <h4 className="text-sm leading-[1.7] font-booking_font_normal font-normal">
                    Review bedroom arrangements to make sure each is right for
                    you. Full and half bathrooms are shown as one total.
                  </h4>
                </div>
                <div className="w-full md:w-full justify-between flex items-center gap-2 md:gap-8">
                  <div className="flex w-full flex-col gap-4 text-lg">
                    <h4 className="text-base font-booking_font_normal pb-1 border-b font-medium">
                      Bedroom
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-2 text-xs font-booking_font_normal font-medium">
                        <LuBedDouble fontSize={"26px"} />1 Queen Bed
                      </div>
                      <div className="flex flex-col gap-2 text-xs font-booking_font_normal font-medium">
                        <LuBedSingle fontSize={"26px"} />1 Single Bed
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-4 text-lg">
                    <h4 className="text-base font-booking_font_normal pb-1 border-b font-medium">
                      Living Room
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-2 text-xs font-booking_font_normal font-medium">
                        <LuBedSingle fontSize={"26px"} />1 Sofa Bed
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-4 text-lg">
                    <h4 className="text-base font-booking_font_normal pb-1 border-b font-medium">
                      Bathrooms
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-2 text-5xl font-bold">
                        1
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* ATTRIBUTES */}
              <div className="w-full pt-4 grid grid-cols-1 gap-y-2">
                <div className="w-full flex flex-col gap-2">
                  <h2
                    style={{ letterSpacing: "4px" }}
                    className="text-xl border-b pb-4  font-booking_font_normal uppercase font-medium"
                  >
                    ATTRIBUTES
                  </h2>
                </div>
                <div className="w-full md:w-[600px] flex text-base font-booking_font_normal font-normal  items-center gap-4 gap-y-2 flex-wrap">
                  <span>Patio/Balcony</span>
                  <span> Tennis Courts: Community </span>
                  <span>Mountain View</span>
                  <span>No Pets Allowed</span>
                  <span>Free Parking</span>
                  <span>Parking Available</span>
                  <span>Private Parking</span>
                </div>
              </div>
              {/* AMENITIES */}
              <div className="w-full pt-4 grid grid-cols-1 gap-y-2">
                <div className="w-full flex flex-col gap-2">
                  <h2
                    style={{ letterSpacing: "4px" }}
                    className="text-xl border-b pb-4 font-booking_font_normal uppercase font-medium"
                  >
                    AMENITIES
                  </h2>
                </div>
                <div className="w-full md:w-[600px] flex text-base font-booking_font_normal font-normal  items-center gap-4 flex-wrap">
                  <span>Patio/Balcony</span>
                  <span> Tennis Courts: Community </span>
                  <span>Mountain View</span>
                  <span>No Pets Allowed</span>
                  <span>Free Parking</span>
                  <span>Parking Available</span>
                  <span>Private Parking</span>
                </div>
              </div>
              {/* SERVICES */}
              <div className="w-full pt-4 grid grid-cols-1 gap-y-2">
                <div className="w-full flex flex-col gap-2">
                  <h2
                    style={{ letterSpacing: "4px" }}
                    className="text-xl border-b pb-4 font-booking_font_normal uppercase font-medium"
                  >
                    SERVICES
                  </h2>
                </div>
                <div className="w-full md:w-[600px] flex text-base font-booking_font_normal font-normal  items-center gap-4 flex-wrap">
                  <span>Patio/Balcony</span>
                  <span> Tennis Courts: Community </span>
                  <span>Mountain View</span>
                  <span>No Pets Allowed</span>
                  <span>Free Parking</span>
                </div>
              </div>
            </div>
            {/* bathrooms */}
          </div>
        </div>
      </div>
    </>
  );
}
