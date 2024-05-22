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
    </>
  );
}
