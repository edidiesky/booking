"use client"
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
const Footer = () => {
  const navbarCenterList = [
    {
      title: "Home",
      icon: "./images/home.png",
    },
    {
      title: "Rooms",
      icon: "./images/svg_1.png",
    },
    {
      title: "Schedule",
      icon: "./About/svg_4.png",
    },

    {
      title: "Contact",
      icon: "./images/svg_2.png",
    },

    // {
    //   title: "Transaction",
    //   icon: "./images/svg_3.png",
    // },
  ];
  return (
    <>
      <div
        className="w-full  py-16 relative bg-[#1D1D1D] flex items-center justify-center
   gap-8"
      >
        <div
          className="w-[90%] mx-auto max-w-custom_1 justify-between z-40 grid md:grid-cols-2 lg:grid-cols-3
      gap-8 md:gap-2"
        >
          <div className="flex flex-col gap-6">
            <img
              src="https://www.nicdarkthemes.com/themes/hotel-booking/wp/demo/hotel/wp-content/uploads/sites/2/2022/04/icon-20.png"
              alt=""
              className="w-12 md:w-16"
            />
            <h3 className="text-2xl text-white font-booking_font4">
              Phone Support
              <span className="block uppercase text-sm font-booking_font text-grey">
                SOCIAL MEDIA CHANNELS
              </span>
            </h3>
            <h3 className="text-2xl text-white font-booking_font4">
              + 01 345 647 745
            </h3>
          </div>

          <div className="flex flex-col gap-6">
            <img
              src="https://www.nicdarkthemes.com/themes/hotel-booking/wp/demo/hotel/wp-content/uploads/sites/2/2022/04/icon-19.png"
              alt=""
              className="w-12 md:w-16"
            />
            <h3 className="text-2xl text-white font-booking_font4">
              Connect With Us
              <span className="block uppercase text-sm font-booking_font text-grey">
                24 HOURS A DAY
              </span>
            </h3>
            <h3 className="text-2xl text-white font-booking_font4">
              + 01 345 647 745
            </h3>
          </div>
          <div className="flex flex-col gap-6">
            <img
              src="https://www.nicdarkthemes.com/themes/hotel-booking/wp/demo/hotel/wp-content/uploads/sites/2/2022/04/icon-20.png"
              alt=""
              className="w-12 md:w-16"
            />
            <h3 className="text-2xl flex flex-col gap-4 text-white font-booking_font4">
              Contact Us
              <span className="block leading-[1.5]  text-base font-booking_font text-grey">
                Reservation : + 202 303 404
              </span>
              <span className="block leading-[1.5]  text-base font-booking_font text-grey">
                Booking : + 414 123 404
              </span>
            </h3>
          </div>
        </div>
      </div>
      <div
        className="w-full  py-4 relative bg-[#000] flex items-center justify-center
   gap-8"
      >
        <div
          className="w-[90%] mx-auto max-w-custom_1 flex items-center justify-between
       gap-4"
        >
          <div className="items-center justify-start flex gap-1">
            {navbarCenterList?.map((list, index) => {
              return (
                <Link
                  href={"#"}
                  key={index}
                  className={`text-sm 
                font-normal  text-white flex items-center gap-2 p-3 px-4 rounded-[40px]`}
                >
                  {/* <img src={list?.icon} className="w-4" alt="" /> */}
                  {list?.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
