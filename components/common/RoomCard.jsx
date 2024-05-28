"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MdArrowRightAlt } from "react-icons/md";

const RoomCard = ({ apartment,index }) => {
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
        <h4
          style={{ letterSpacing: "3px" }}
          className="text-xs text-grey uppercase font-booking_font_bold font-bold"
        >
          for settling in castle
        </h4>
        <h3 className="text-2xl lg:text-4xl font-booking_font4 font-medium text-text_dark_1 ">
          {apartment?.title}
        </h3>

        <div
          style={{ letterSpacing: "3px" }}
          className="py-4 flex items-center gap-2 pb-3 uppercase border-b border-[rgba(0,0,0,.6)] text-xs font-bold font-booking_font_bold"
        >
          explore homes <MdArrowRightAlt />
        </div>
      </div>
    </Link>
  );
};

export default RoomCard;
