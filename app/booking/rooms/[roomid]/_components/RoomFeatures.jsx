"use client";
import React, { useRef } from "react";
import { RoomFeaturesList, RoomFeaturesList2 } from "@/constants/data/feature";

export default function RoomFeatures() {
  return (
    <>
      <div className="w-full">
        <div className="w-[90%] mx-auto max-w-custom_2 grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="flex w-full flex-col gap-8">
            <h2 className="text-3xl pb-4 border-b font-booking_font4">
              Home Features
            </h2>
            <div className="w-full flex flex-col gap-8">
              <h4 className="text-base leading-[1.7] font-booking_font_normal font-normal">
                Enjoy the comforts of home and beyond with these distinctive
                features.
              </h4>
              <div className="w-full grid grid-cols-3 md:grid-cols-4 gap-4">
                {RoomFeaturesList.map((x, index) => {
                  return (
                    <div
                      key={index}
                      className="flex text-sm font-normal items-center justify-center flex-col gap-2 font-booking_font5"
                    >
                      {x?.icon}
                      <span className="w-full text-center"> {x.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-8">
            <h2 className="text-xl pb-4 border-b font-booking_font4">
              All Stays Included
            </h2>
            <div className="w-full flex flex-col gap-8">
              <h4 className="text-base leading-[1.5] font-booking_font_normal font-normal">
                We believe certain amenities should be standard. Every home
                comes outfitted with these best-in-class essentials for a
                worry-free stay.
              </h4>
              <div className="w-full grid grid-cols-3 gap-4">
                {RoomFeaturesList2.map((x, index) => {
                  return (
                    <div
                      key={index}
                      className="flex text-sm font-normal flex-col gap-2 font-booking_font5"
                    >
                      {x?.icon}
                      <span className="w-full text-start"> {x.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
