"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import GuestsModal from "@/components/modals/Guests";
export default function Hero() {
  const container = useRef(null);
  const [datemodal, setDateModal] = useState(false);
  return (
    <>
      <div className="w-full rounded-3xl shadow-xl sticky top-0 z-[50] left-0 right-0 mx-auto max-w-custom p-8 px-2 bg-white">
        <div className="w-[90%] mx-auto flex flex-col gap-6">
          <div className="w-full font-booking_font4 flex flex-col gap-4">
            <div className="flex w-full items-center justify-between">
              <h5 className="text-base">Popular Filters</h5>
              <h5 className="text-base font-booking_font_bold">755 homes</h5>
            </div>
            <div className="flex font-booking_font_bold w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="border p-4 text-sm rounded-xl">
                  Pets Allowed
                </div>
                <div className="border p-4 text-sm rounded-xl">
                  Pets Allowed
                </div>
                <div className="border p-4 text-sm rounded-xl">
                  Pets Allowed
                </div>
              </div>
              <div className="border p-4 text-sm rounded-xl">Filter & Sort</div>
            </div>

            {/* search listing */}
          </div>
        </div>
      </div>
    </>
  );
}
