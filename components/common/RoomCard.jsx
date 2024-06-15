"use client";
import moment from "moment";
import axios from "axios";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { FaRegUserCircle } from "react-icons/fa";
import { FaWifi } from "react-icons/fa6";
import React, { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MdArrowRightAlt } from "react-icons/md";
import Heart from "@/assets/svg/heart";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/app/hooks/useCustomRedux";
import { addListToWish } from "@/app/libs/features/favourites/favouritesReducer";
import { onLoginModal } from "@/app/libs/features/modals/modalSlice";
const RoomCard = ({ apartment, index, type, currentUser }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [tabindex, setTabIndex] = useState(0);
  // console.log(currentUser);
  const handleFavouriteRooms = useCallback(() => {
    // check if the user exists
    // else perform wish lists
    if (!currentUser) {
      dispatch(onLoginModal());
    } else {
      dispatch(addListToWish(apartment?.id));
      // router.refresh();
    }
  }, [currentUser, router]);

  const customerData = JSON.parse(localStorage.getItem("client"));
  // console.log(customerData);
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
          placeholder="blur"
          style={{
            transition:
              "filter 0.2s cubic-bezier(0.4, 0, 0.2, 1), -webkit-filter 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          src={apartment?.rooms?.images[0]}
          blurDataURL={apartment?.rooms?.images[0]}
          className="w-full min-h-[350px] object-cover hover:grayscale-[1] grayscale-0"
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

  if (type === "Search") {
    return (
      <Link
        href={`/booking/rooms/${apartment?.id}`}
        className="w-full flex flex-col gap-8 border"
      >
        <div className="w-full h-[260px] overflow-hidden relative">
          <div className="w-full h-full absolute bg-[rgba(0,0,0,.3)] z-[30]"></div>

          <Link
            href={"#"}
            onClick={handleFavouriteRooms}
            className="absolute z-[30] top-[10%] left-[5%]"
          >
            <Heart />
          </Link>
          <div className="h-full z-[40] absolute left-0 w-[80px] flex items-center justify-center">
            <div
              // href={"#"}
              onClick={() => handleImagePosition("left")}
              className="w-12 h-12 text-lg bg-[#00000013] hover:bg-[#00000072] hover:scale-[1.09] cursor-pointer text-white flex items-center justify-center z-[40]"
            >
              <BiChevronLeft fontSize={"30px"} />
            </div>
          </div>
          <div className="h-full z-[40] absolute right-0 w-[80px] flex items-center justify-center">
            <div
              // href={"#"}
              onClick={() => handleImagePosition("right")}
              className="w-12 h-12 text-lg bg-[#00000013] hover:bg-[#00000072] hover:scale-[1.09] cursor-pointer text-white flex items-center justify-center"
            >
              <BiChevronRight fontSize={"30px"} />
            </div>
          </div>
          <div
            style={{ gridTemplateColumns: "repeat(4, 100%)" }}
            className="w-full h-full absolute top-0 left-0 overflow-hidden grid"
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
                    placeholder="blur"
                    style={{
                      transition:
                        "filter 0.2s cubic-bezier(0.4, 0, 0.2, 1), -webkit-filter 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    blurDataURL={image}
                    src={image}
                    className="w-full z-10 h-[100%] object-cover hover:grayscale-[1] grayscale-0"
                  />
                </div>
              );
            })}
          </div>
          <div className="absolute z-[40] left-0 bottom-[5%] w-full flex items-center justify-center">
            <div className="w-full flex items-center justify-center gap-1">
              {Array(apartment?.images?.length)
                .fill("")
                .map((tab, index) => {
                  const active = tabindex === index;
                  return (
                    <span
                      key={index}
                      className={`w-[7px] ${
                        active ? "bg-[#fff]" : "bg-[#7b797972]"
                      }  h-[7px] cursor-pointer hover:scale-[1.09] rounded-full`}
                    ></span>
                  );
                })}
            </div>
          </div>
          {/* <img src= alt="" /> */}
        </div>
        <div className="w-full bg-white flex-col gap-4 flex items-start p-3 pb-8 px-8 z-[40]">
          <h3 className="text-2xl md:text-3xl text-dark font-booking_font4">
            {apartment?.title}
          </h3>
          <span className="flex items-center gap-4">
            <span className="flex text-grey gap-3 items-center text-sm font-normal uppercase">
              <FaRegUserCircle fontSize={"20px"} />3 Guests
            </span>
            <span className="flex text-grey gap-3 items-center text-sm font-normal uppercase">
              <FaWifi fontSize={"20px"} /> Free Wifi
            </span>
          </span>
{/* 
          <span className="text-sm leading-[1.6] font-light text-dark">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vel
            molestie nisl. Duis ac mi leo.
          </span> */}
          <div className="w-full flex items-center">
            <div className="w-[200px] min-h-[50px] flex items-center justify-center text-sm uppercase font-bold border-2 border-[rgba(0,0,0,1)]">
              book now for ${apartment?.price}
            </div>
            <div className="w-[60px] min-h-[50px] flex items-center justify-center text-sm uppercase font-bold text-white bg-[rgba(0,0,0,1)]">
              i
            </div>
          </div>
          <div className="pt-4 mt-4 w-full border-t flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://www.nicdarkthemes.com/themes/hotel-booking/wp/demo/hotel/wp-content/uploads/sites/2/2022/04/king-beds.png"
                alt=""
                className="w-8"
              />
              <img
                src="https://www.nicdarkthemes.com/themes/hotel-booking/wp/demo/hotel/wp-content/uploads/sites/2/2022/04/private-bathroom.png"
                alt=""
                className="w-6"
              />
              <img
                src="https://www.nicdarkthemes.com/themes/hotel-booking/wp/demo/hotel/wp-content/uploads/sites/2/2022/04/no-smoking.png"
                alt=""
                className="w-6"
              />
              <img
                src="https://www.nicdarkthemes.com/themes/hotel-booking/wp/demo/hotel/wp-content/uploads/sites/2/2022/04/television.png"
                alt=""
                className="w-6"
              />
            </div>

            <span className="text-sm flex items-center leading-[1.6] font-light text-dark">
              FULL INFO
              <BiChevronRight fontSize={"20px"} />
            </span>
          </div>
        </div>
      </Link>
    );
  }
  return (
    <Link
      href={`/booking/rooms/${apartment?.id}`}
      className="w-full flex flex-col gap-8"
    >
      <div className="w-full h-[270px] overflow-hidden relative">
        <div className="w-full h-full absolute bg-[rgba(0,0,0,.09)] z-[30]"></div>
        <div className="w-full absolute justify-end h-full flex-col gap-1 flex items-start p-6 pb-8 px-8 z-[40]">
          <h3 className="text-2xl text-white font-booking_font4">
            {apartment?.title}
          </h3>
          <span className="flex items-center gap-4">
            <span className="flex text-white gap-3 items-center text-sm font-normal uppercase">
              <FaRegUserCircle fontSize={"20px"} />3 Guests
            </span>
            <span className="flex text-white gap-3 items-center text-sm font-normal uppercase">
              <FaWifi fontSize={"20px"} /> Free Wifi
            </span>
          </span>
        </div>
        <Link
          href={"#"}
          onClick={handleFavouriteRooms}
          className="absolute z-[30] top-[10%] left-[5%]"
        >
          <Heart />
        </Link>
        <div className="h-full z-[40] absolute left-0 w-[80px] flex items-center justify-center">
          <Link
            href={"#"}
            onClick={() => handleImagePosition("left")}
            className="w-12 h-12 text-lg bg-[#00000013] hover:bg-[#00000072] hover:scale-[1.09] cursor-pointer text-white flex items-center justify-center z-[40]"
          >
            <BiChevronLeft fontSize={"30px"} />
          </Link>
        </div>
        <div className="h-full z-[40] absolute right-0 w-[80px] flex items-center justify-center">
          <Link
            href={"#"}
            onClick={() => handleImagePosition("right")}
            className="w-12 h-12 text-lg bg-[#00000013] hover:bg-[#00000072] hover:scale-[1.09] cursor-pointer text-white flex items-center justify-center"
          >
            <BiChevronRight fontSize={"30px"} />
          </Link>
        </div>
        <div
          style={{ gridTemplateColumns: "repeat(4, 100%)" }}
          className="w-full h-full absolute top-0 left-0 overflow-hidden grid"
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
                  placeholder="blur"
                  style={{
                    transition:
                      "filter 0.2s cubic-bezier(0.4, 0, 0.2, 1), -webkit-filter 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  blurDataURL={image}
                  src={image}
                  className="w-full z-10 h-[100%] object-cover hover:grayscale-[1] grayscale-0"
                />
              </div>
            );
          })}
        </div>
        <div className="absolute z-[40] left-0 bottom-[5%] w-full flex items-center justify-center">
          <div className="w-full flex items-center justify-center gap-1">
            {Array(apartment?.images?.length)
              .fill("")
              .map((tab, index) => {
                const active = tabindex === index;
                return (
                  <span
                    key={index}
                    className={`w-[7px] ${
                      active ? "bg-[#fff]" : "bg-[#7b797972]"
                    }  h-[7px] cursor-pointer hover:scale-[1.09] rounded-full`}
                  ></span>
                );
              })}
          </div>
        </div>
        {/* <img src= alt="" /> */}
      </div>
    </Link>
  );
};

export default RoomCard;
