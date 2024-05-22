"use client";
import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { BiChevronLeft, BiHeart } from "react-icons/bi";
export default function RoomGallery({ setGalleryModal, modal, room }) {
  return (
    <div
      className="w-full h-full bg-white z-[10000000] fixed top-0 bottom-0
     left-0 flex flex-col gap-4"
    >
      <div className="flex w-[95%] py-4 mx-auto sticky top-0 left-0 text-2xl items-center justify-between">
        <span onClick={() => setGalleryModal(false)}>
          <BiChevronLeft className="text-2xl cursor-pointer" />
        </span>
        <span className="flex justify-end">
          <BiHeart className="text-2xl cursor-pointer" />
        </span>
      </div>
      <div className="w-full h-[80%] overflow-auto md:w-[400px] flex flex-col gap-2 mx-auto">
        {room?.images?.map((room, index) => {
          return (
            <Image
              alt="Room Images"
              width={0}
              sizes="100vw"
              height={0}
              loading="lazy"
              src={room}
              className=" w-full h-full"
            />
          );
        })}
      </div>
    </div>
  );
}
