"use client";
import React, { useState } from "react";
import Image from "next/image";

const RoomDetail = () => {
  const room = {
    image: "/images/images_1.jpg",
  };
  return (
    <div className="w-full shadow-xl bg-[#fff] border p-6 rounded-md">
      <div className="w-full flex flex-col gap-8">
        <h4 className="text-3xl font-booking_font4 font-bold">Preview</h4>
        <div className="w-full flex flex-col gap-4">
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
            src="/images/images_1.jpg"
            className="w-full h-[200px] rounded-lg object-cover hover:grayscale-[1] grayscale-0"
          />
          <div className="w-full flex flex-col gap-2">
            <h4
              style={{ letterSpacing: "3px" }}
              className="text-xs text-grey uppercase font-booking_font_bold font-bold"
            >
              for settling in castle
            </h4>
            <h3 className="text-2xl lg:text-3xl font-booking_font4 font-medium text-text_dark_1 ">
              BeachFront Oasis
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
