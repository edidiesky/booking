"use client";
import React, { useRef } from "react";
import Link from "next/link";
import {
  opacity,
  slideup,
  smallslideup,
  slideup2,
} from "@/constants/utils/framer";
import { motion, useInView } from "framer-motion";
import Imagewrapper from "./Imagewrapper";
export default function RoomTitleAndDescription() {
  const ctaText_1 = useRef(null);
  const ctaText_2 = useRef(null);
  const inView = useInView(ctaText_1, {
    margin: "0px 100px -50px 0px",
  });
  return (
    <>
      <div className="w-full mt-4 flex flex-col gap-8">
        {/* title */}
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl font-extrabold font-booking_font4">
            The Home
          </h2>
          <div className="w-full flex flex-col gap-6">
            <h4 className="text-lg leading-[1.5] font-booking_font font-normal">
              1 Free single kayak or Standup Paddleboard, or 50% off a double
              kayak for 2 hours. Or take 15% off all rental e-bikes,
              paddleboards, or kayaks for your entire family.
            </h4>
            <h4 className="text-lg leading-[1.5] font-booking_font font-normal">
              BEST LOCATION! Located in central Big Bear where you are no more
              than 3.5 miles from EVERY fun activity that Big Bear has to offer.
              This cabin is adorable with an incredible forest feel, a fenced
              yard, and a patio with a gas firepit!
            </h4>
            <div className="flex flex-col">
              <h4 className="text-lg leading-[1.5] font-booking_font font-normal">
                LOCATION: 0.7 Miles to the VILLAGE (3 Minute drive, 13 Minute
                walk) <br /> 0.8 Miles to the LAKE (4 Minute Drive, 16 Minute
                Walk) <br /> 1.3 Miles to SNOW SUMMET SLOPES (5 Minute Drive){" "}
                <br /> 2.0 Miles to VONS (6 Minute Drive) <br /> 2.5 Miles to
                the ALPINE ZOO (6 Minute Drive)
                <br /> 3.4 Miles to BEAR MOUNTAIN SLOPES (9 Minute Drive)
              </h4>
            </div>
            <h4 className="text-lg leading-[1.5] font-booking_font font-normal">
              SLEEPS 3 People - 1 Bedroom, 1 Bathroom. 600 sq ft. - 1 Cars
              MAXIMUM!
            </h4>
            <h4 className="text-xl font-booking_font_normal font-normal"></h4>
          </div>
        </div>
      </div>
    </>
  );
}
