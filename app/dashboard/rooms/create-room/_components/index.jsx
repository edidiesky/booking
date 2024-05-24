"use client";
import React, { useState } from "react";
import RoomForms from "./roomsform";
import RoomDetail from "./roomdetail";
const DashboardIndex = () => {
  const [roommodal, setRoomModal] = useState(false);
  return (
    <div className="w-full">
      <div className="w-full pb-20 flex flex-col gap-12">
        <div className="w-full grid lg:grid-cols-2 lg:items-center gap-4 justify-between">
          <h3 className="text-4xl font-booking_font4 font-bold">
            Add Your Room
            <span className="block pt-6 text-sm font-booking_font font-normal">
              The most important idea about this section is that it gives u
              ability to add your rooms. When adding your room product idea do
              not foget to fill out the forms
            </span>
          </h3>
        </div>
        <div className="w-full grid md:grid-cols-custom gap-6">
          <RoomForms />
          <div className="w-full md:w-[300px]">
            <RoomDetail />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardIndex;
