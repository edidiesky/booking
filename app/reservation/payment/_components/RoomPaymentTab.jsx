"use client";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { BiChevronDown } from "react-icons/bi";
import moment from "moment";
export default function RoomPaymentTab() {

  return (
    <div className="w-full flex-col gap-8">
      <div className="border shadow-xl rounded-xl overflow-hidden flex flex-col w-full">
        <Image
          alt="Cotion"
          width={0}
          sizes="100vw"
          height={0}
          loading="lazy"
          src="/apartment_1.jpg"
          className="image w-full h-[300px]"
        />
        <div className="w-full flex flex-col gap-2">
          <div className="flex p-8 pb-6 border-b-4 flex-col w-full gap-2">
            <span className="text-sm font-booking_font4 font-normal">
              1 Bedroom | 3 Guests
            </span>
            <h1 className="text-4xl w-100 font-medium font-booking_font3">
              SLOPESIDE CHALET - Adorable cabin with a f...
            </h1>
            <span className="text-sm font-booking_font4 font-normal">
              Big Bear Lake, CA
            </span>
            {/* date and guests */}
            <div className="py-3 flex items-center justify-between w-full">
              {/* date */}
              <div className="flex flex-col gap-2">
                <span className="text-base font-booking_font4 font-bold">
                  Dates
                </span>
                <span className="text-base font-booking_font4 font-normal">
                  May 8 - 10, 2024
                </span>
              </div>

              {/* guests */}
              <div className="flex flex-col gap-2">
                <span className="text-base font-booking_font4 font-bold">
                  Guests
                </span>
                <span className="text-base font-booking_font4 font-normal">
                  1 guest
                </span>
              </div>
            </div>
          </div>
          <div className="w-full flex p-4 pb-6 px-8 border-b-4 flex-col gap-2">
            {/* price */}
            <div className="w-full text-base font-light font-booking_font4 flex items-center justify-between">
              <span>238.20 x 2 nights</span>
              <span>
                476.40 <span className="text-base">USD</span>
              </span>
            </div>
            {/* taxes */}
            <div className="w-full text-base pb-4 font-light font-booking_font4 flex items-center justify-between">
              <span>Fees and taxess</span>
              <span>
                476.40 <span className="text-base">USD</span>
              </span>
            </div>
            {/* total */}
            <div className="w-full text-lg font-light font-booking_font4 pt-4 border-t flex items-center justify-between">
              <span className="font-bold">Total Cash</span>
              <span className="font-bold">
                476.40 <span className="text-base font-light">USD</span>
              </span>
            </div>
          </div>
          <div className="w-full flex p-4 px-8 flex-col gap-2">
            {/* price */}
            <div className="w-full text-lg font-light font-booking_font4 flex items-center justify-between">
              <span className="font-bold">Total Cash</span>
              <span className="font-bold">
                476.40 <span className="text-base font-light">USD</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
