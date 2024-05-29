"use client";
import moment from "moment";
import axios from "axios";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MdArrowRightAlt } from "react-icons/md";
import Heart from "@/assets/svg/heart";

import toast from "react-hot-toast";
const RoomCard = ({ apartment, index, type, currentUser }) => {
  const [tabindex, setTabIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [rooms, setRooms] = useState([]);
  const handleSaveRoom = async () => {
    try {
      const { data } = await axios.post(
        `/api/rooms/wish/${apartment?.id}`,
        apartment
      );
      // console.log(data);
      const { favourite, message } = data;
      await axios.get(`/api/rooms`);
      setLiked(favourite);
      // console.log(user?.favourites?.includes(apartment));
      toast.success(message);
    } catch (error) {
      toast.danger(error?.response?.data?.message);
    } finally {
    }
  };
  // useEffect(() => {
  //   const handleSaveRoom = async () => {
  //     try {
  //       const { data } = await axios.get(`/api/rooms`);
  //       setRooms(data);
  //     } catch (error) {
  //       toast.danger(error?.response?.data?.message);
  //     }
  //   };
  //   handleSaveRoom();
  // }, [setRooms, liked]);

  const handleImagePosition = (position) => {
    if (position === "left") {
      setTabIndex(tabindex < 0 ? apartment?.images?.length - 1 : tabindex - 1);
    }
    if (position === "right") {
      setTabIndex(tabindex >= apartment?.images?.length ? 0 : tabindex + 1);
    }
  };
  if (type === "trips") {
    const startDate = moment(apartment?.startDate).format("MMMM Do");

    const endDate = moment(apartment?.endDate).format("MMMM Do");
    return (
      <Link
        href={`/reservation/payment/?reservationId=${apartment?.id}`}
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
          src={apartment?.rooms?.images[0]}
          className="w-full h-[300px] object-cover hover:grayscale-[1] grayscale-0"
        />
        <div className="w-full flex flex-col py-3 bg-white gap-2">
          <h4
            style={{ letterSpacing: "3px" }}
            className="text-xs text-grey uppercase font-booking_font_bold font-bold"
          >
            for settling in castle
          </h4>
          <h3 className="text-2xl font-booking_font4 font-medium text-text_dark_1 ">
            {apartment?.rooms?.title}
          </h3>

          <div
            style={{ letterSpacing: "1px" }}
            className="py-2 flex items-center justify-between gap-2 pb-2 uppercase border-b border-[rgba(0,0,0,.6)] text-xs font-bold font-booking_font_bold"
          >
            <span className="flex uppercase items-center gap-2">
              Date: <span>{startDate}</span> - <span>{endDate}</span>
            </span>

            <span className="flex text-xs text-grey font-normal font-booking_font flex-col">
              price
              <span className="block text-lg text-stone-950 font-bold font-booking_font_bold">
                ${apartment?.rooms?.price}
              </span>
            </span>
          </div>
        </div>
      </Link>
    );
  }
  const active = JSON.parse(apartment?.favourites)?.includes(currentUser?.id);
  // console.log(liked || active);

  return (
    <div key={index} className="w-full flex flex-col">
      <div className="w-full h-[320px] relative">
        <div
          onClick={handleSaveRoom}
          className="absolute z-[30] top-[10%] right-[5%]"
        >
          <Heart active={active} />
        </div>
        <div className="h-full z-20 absolute left-0 w-[80px] flex items-center justify-center">
          <div
            onClick={() => handleImagePosition("left")}
            className="w-12 h-14 text-xl bg-[#00000013] hover:bg-[#00000072] hover:scale-[1.09] cursor-pointer text-white flex items-center justify-center z-20"
          >
            <BiChevronLeft fontSize={"30px"} />
          </div>
        </div>
        <div className="h-full z-20 absolute right-0 w-[80px] flex items-center justify-center">
          <div
            onClick={() => handleImagePosition("right")}
            className="w-12 h-14 text-xl bg-[#00000013] hover:bg-[#00000072] hover:scale-[1.09] cursor-pointer text-white flex items-center justify-center"
          >
            <BiChevronRight fontSize={"30px"} />
          </div>
        </div>
        <div
          style={{ gridTemplateColumns: "repeat(4, 100%)" }}
          className="w-full h-full absolute overflow-hidden grid"
        >
          {apartment.images.map((image, index) => {
            return (
              <div
                style={{
                  transform: `translateX(-${tabindex * 100}%)`,
                  transition: "all .4s ease",
                }}
                key={index}
                className="w-full h-full"
              >
                <Image
                  key={index}
                  alt="Cotion"
                  width={0}
                  sizes="100vw"
                  height={0}
                  loading="lazy"
                  style={{
                    transition:
                      "filter 0.2s cubic-bezier(0.4, 0, 0.2, 1), -webkit-filter 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  src={image}
                  className="w-full z-10 h-[100%] object-cover hover:grayscale-[1] grayscale-0"
                />
              </div>
            );
          })}
        </div>
        <div className="absolute z-20 left-0 bottom-[5%] w-full flex items-center justify-center">
          <div className="w-full flex items-center justify-center gap-1">
            {Array(apartment?.images?.length)
              .fill("")
              .map((tab, index) => {
                const active = tabindex === index;
                return (
                  <span
                    key={index}
                    className={`w-[10px] ${
                      active ? "bg-[#fff]" : "bg-[#18181872]"
                    }  h-[10px] cursor-pointer hover:scale-[1.09] rounded-full`}
                  ></span>
                );
              })}
          </div>
        </div>
      </div>
      <Link
        href={`booking/rooms/${apartment?.id}`}
        className="w-full flex flex-col py-3 bg-white gap-2"
      >
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
      </Link>
    </div>
  );
};

export default RoomCard;
