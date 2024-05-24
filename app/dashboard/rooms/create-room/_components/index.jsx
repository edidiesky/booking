"use client";
import React, { useState } from "react";
import { AnimatePresence, Variant } from "framer-motion";
import ReservationRoomsModal from "@/components/modals/ReservationRoomsModal";
import RoomForms from "./roomsform";
const DashboardIndex = () => {
  const [roommodal, setRoomModal] = useState(false);
  return (
    <div className="w-full">
      <div className="w-full pb-20 flex flex-col gap-12">
        <div className="w-full grid lg:grid-cols-2 lg:items-center gap-4 justify-between">
          <h3 className="text-4xl font-booking_font4 font-bold">
           Add Your Room
            <span className="block pt-4 text-base font-booking_font font-normal">
              Make a review of your rooms created either by adding or modifying
              their content
            </span>
          </h3>
        </div>
        <RoomForms />
      </div>
    </div>
  );
};

export default DashboardIndex;
