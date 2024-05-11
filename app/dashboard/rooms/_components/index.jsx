"use client";
import React, { useState } from "react";
import { AnimatePresence, Variant } from "framer-motion";
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
        <div className="w-full flex items-center justify-between">
          <h3 className="text-4xl font-booking_font font-bold">My Rooms</h3>
          <div className="flex items-center gap-2">
            <div
              onClick={() => setRoomModal(true)}
              className="p-4 btn cursor-pointer text-base
             bg-[#C5F244] px-8 font-booking_font 
             rounded-[20px] font-bold text-dark"
            >
              Add a room
            </div>
          </div>
        </div>
        <RoomsList/>
      </div>
    </div>
  );
};

export default DashboardIndex;
