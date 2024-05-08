"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Menu from "./Menu";
import { BiCart } from "react-icons/bi";
import { HiBars3 } from "react-icons/hi2";
const Navbar = ({ text, path }) => {
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState(false);
  const handleScroll = () => {
    window.scrollY > 150 ? setActive(true) : setActive(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div
      className={`${
        active ? "shadow-lg bg-white" : "bg-inherit"
      } w-full sticky min-h-[70px] top-0 z-[500] py-4`}
    >
      <Menu setMenu={setMenu} menu={menu} />
      <div className={`w-full mx-auto max-w-custom_2`}>
        <div className="w-[95%] mx-auto text-text_dark_1 flex item-center justify-space gap-2 md:gap-4">
          <div className="flex md:hidden items-center justify-start flex-1 span">
            <HiBars3 fontSize={"34px"} color="#000" />
          </div>
          <div className="flex-1 hidden md:flex items-center gap-8">
            <Link href={"/"} className="font-booking_font2 font-bold text-lg">
              Home
            </Link>
            <Link href={"/"} className="font-booking_font2 font-bold text-lg">
              About
            </Link>

            <Link href={"/"} className="font-booking_font2 font-bold text-lg">
              Collections
            </Link>

            <Link href={"/"} className="font-booking_font2 font-bold text-lg">
              Service
            </Link>
          </div>
          <div className="flex-1 flex items-center gap-1 justify-center">
            <Image
              alt="Cotion"
              width={0}
              sizes="100vw"
              height={0}
              loading="lazy"
              src="https://www.hopper.com/assets/treasure-D-5S8iOp.svg"
              className="w-14 h-14 rounded-full object-cover"
            />
            <h4 className="hidden md:flex flex-col text-xl font-bold text-dark">
              HOME & VILLAS{" "}
              <span className="block font-bold text-xs font-booking_font1">
                {" "}
                Benneth Okeke
              </span>
            </h4>
          </div>
          <div className="flex-1 flex items-end justify-end gap-4">
            <div className="w-12 md:w-14 h-12 md:h-14 rounded-full bg-[#000] flex items-center justify-center text-2xl text-white">
              <BiCart />
            </div>
            <img
              src="/user_2.png"
              alt=""
              className="w-12 md:w-14 h-12 md:h-14 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
