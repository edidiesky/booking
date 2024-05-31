"use client";
import React, { useState } from "react";
import { AnimatePresence, Variant } from "framer-motion";
import Link from "next/link";
import ReservationRoomsModal from "@/components/modals/ReservationRoomsModal";
import RoomsList from "./rooms";
const DashboardIndex = () => {
  const [roommodal, setRoomModal] = useState(false);
  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {roommodal && (
          <ReservationRoomsModal modal={roommodal} setModal={setRoomModal} />
        )}
      </AnimatePresence>
      <div className="w-full pb-20 flex flex-col gap-12">
        <div className="w-full grid lg:grid-cols-2 lg:items-center gap-4 justify-between">
          <h3 className="text-4xl font-booking_font_bold font-bold">
            My Rooms
            <span className="block pt-2 text-base font-booking_font font-normal">
              Make a review of your rooms created either by adding or modifying
              their content
            </span>
          </h3>
          <div className="flex items-center lg:justify-end gap-2">
            <Link
              href={"/dashboard/rooms/create-room"}
              className="p-3 btn cursor-pointer text-sm px-8 font-booking_font 
             rounded-[10px] font-bold text-white"
            >
              Add a room
            </Link>
          </div>
        </div>
        <RoomsList />
      </div>
    </div>
  );
};

export default DashboardIndex;
