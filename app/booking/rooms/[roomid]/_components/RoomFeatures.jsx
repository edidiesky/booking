"use client";
import React, { useRef } from "react";
import { CgHomeScreen } from "react-icons/cg";
import {
  PiLockKeyOpenThin,
  PiCookingPot,
  PiTelevisionSimpleBold,
  PiBathtubFill,
  PiElevatorLight,
} from "react-icons/pi";
import { FaDog } from "react-icons/fa";
import { BiSupport } from "react-icons/bi";
import { MdBathtub } from "react-icons/md";
import { IoIosCar } from "react-icons/io";
import { MdOutlineFireplace } from "react-icons/md";
import { FaFireExtinguisher } from "react-icons/fa6";
import { CgSmartHomeRefrigerator } from "react-icons/cg";
const featureList1 = [
  { title: "Home Screen", icon: <CgHomeScreen fontSize={"24px"} /> },
  { title: "Bath Tub", icon: <PiBathtubFill fontSize={"24px"} /> },
  { title: "Pets Allowed", icon: <FaDog fontSize={"24px"} /> },
  { title: "Free Parking", icon: <IoIosCar fontSize={"24px"} /> },
  {
    title: " Home Refrigerator",
    icon: <CgSmartHomeRefrigerator fontSize={"24px"} />,
  },
  {
    title: "Fire Extinguisher",
    icon: <FaFireExtinguisher fontSize={"24px"} />,
  },
  { title: "Lock Key", icon: <PiLockKeyOpenThin fontSize={"24px"} /> },
  { title: "Fire place", icon: <MdOutlineFireplace fontSize={"24px"} /> },
  { title: "Elevator Light", icon: <PiElevatorLight fontSize={"24px"} /> },
  { title: "Bath tub", icon: <MdBathtub fontSize={"24px"} /> },
];

const featureList2 = [
  { title: "Support", icon: <BiSupport fontSize={"24px"} /> },
  { title: "Bath Tub", icon: <PiBathtubFill fontSize={"24px"} /> },
  { title: "Pets Allowed", icon: <FaDog fontSize={"24px"} /> },
  { title: "Free Parking", icon: <IoIosCar fontSize={"24px"} /> },
  { title: "Cooking Utensils", icon: <PiCookingPot fontSize={"24px"} /> },
  {
    title: "Cooking Utensils",
    icon: <PiTelevisionSimpleBold fontSize={"24px"} />,
  },
  {
    title: " Home Refrigerator",
    icon: <CgSmartHomeRefrigerator fontSize={"24px"} />,
  },
  {
    title: "Fire Extinguisher",
    icon: <FaFireExtinguisher fontSize={"24px"} />,
  },
];
export default function RoomFeatures() {
  return (
    <>
      <div className="w-full mt-4 grid grid-cols-1 md:grid-cols-custom_5 gap-16">
        <div className="w-full p-4 py-16 md:p-20 bg-[#E8EEED]">
          <div className="flex flex-col gap-8 w-[95%] lg:w-[80%] mx-auto max-w-custom_2">
            <div className="flex w-full flex-col gap-8">
              <h2
                style={{ letterSpacing: "4px" }}
                className="text-4xl pb-4 border-b font-booking_font4 uppercase border-[rgba(0,0,0,.6)] font-medium"
              >
                Home Features
              </h2>
              <div className="w-full flex flex-col gap-16">
                <h4 className="text-sm leading-[1.7] font-booking_font_normal font-normal">
                  Enjoy the comforts of home and beyond with these distinctive
                  features.
                </h4>
                <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
                  {featureList1.map((x, index) => {
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
          </div>
        </div>
        <div className="w-full lg:w-[30vw] py-16 bg-[#E8EEED]">
          <div className="w-[80%] lg:w-[80%] flex flex-col gap-8 mx-auto max-w-custom_2">
            <div className="flex w-full flex-col gap-8">
              <h2
                style={{ letterSpacing: "4px" }}
                className="text-xl pb-4 border-b font-booking_font_normal uppercase border-[rgba(0,0,0,.6)] font-medium"
              >
                ALL STAYS INCLUDE
              </h2>
              <div className="w-full flex flex-col gap-16">
                <h4 className="text-sm leading-[1.7] font-booking_font_normal font-normal">
                  We believe certain amenities should be standard. Every home
                  comes outfitted with these best-in-class essentials for a
                  worry-free stay.
                </h4>
                <div className="w-full grid grid-cols-2 gap-x-8 gap-y-8">
                  {featureList2.map((x, index) => {
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
      </div>
    </>
  );
}
