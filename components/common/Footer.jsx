"use client"
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
const Footer = () => {
  return (
    <div className="relative min-h-[40vh] flex flex-col items-center justify-center bg-[var(--dark-1)]">
      <div className="w-[90%] px-8 max-w-custom_2 mx-auto py-20 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
        <div className="flex-1 gap-2 flex items-center justify-start md:justify-center">
          <Image
            alt="Cotion"
            width={0}
            sizes="100vw"
            height={0}
            loading="lazy"
            src="https://www.hopper.com/assets/treasure-D-5S8iOp.svg"
            className="w-14 h-14 rounded-full object-cover"
          />
          <h4 className="text-3xl font-bold text-white">
            HOME & VILLAS{" "}
            <span className="block font-medium text-base font-booking_font1">
              {" "}
              Benneth Okeke
            </span>
          </h4>
        </div>
        <div className="w-100 flex md:flex-row flex-col items-start gap-20">
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-normal text-white font-booking_font">
              Destinations
            </h4>
            <h4 className="text-sm font-normal text-white font-booking_font">
              Search Homes
            </h4>
            <h4 className="text-sm font-normal text-white font-booking_font">
              Offers
            </h4>
            <h4 className="text-sm font-normal text-white font-booking_font">
              Collection Pages
            </h4>
            <h4 className="text-sm font-normal text-white font-booking_font">
              Sitemap
            </h4>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-normal text-white font-booking_font">
              Marriott.com
            </h4>
            <h4 className="text-sm font-normal text-white font-booking_font">
              Marriott BonvoyTM
            </h4>
            <h4 className="text-sm font-normal text-white font-booking_font">
              Tours & Activities
            </h4>
            <h4 className="text-sm font-normal text-white font-booking_font">
              Collection Connectivity Partners
            </h4>
          </div>
        </div>
      </div>
      <div className="w-[95%] pt-4 border-t border-[rgba(255,255,255,.3)] max-w-custom mx-auto py-20 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
        <div className="flex-1 gap-2 flex items-start justify-start">
          <h4 className="text-sm font-normal font-booking_font text-white">
            © Copyright 2024, Victor Essien, All rights reserved.
          </h4>
        </div>
      </div>
    </div>
  );
};

export default Footer;
