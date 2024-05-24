"use client";
import React, { useState } from "react";
import { BiSearch } from "react-icons/bi";
import Loader from "@/components/loader";

const RoomForms = () => {
  return (
    <div className="w-full shadow-xl bg-[#fff] border p-6 px-2 rounded-md">
      <div className="w-[95%] md:w-[90%] mx-auto flex flex-col gap-8">
        <div className="w-full flex items-center justify-between">
          <h4 className="text-2xl font-booking_font4 font-bold">Name & Description</h4>
          <div className="flex items-center justify-end"></div>
        </div>
      </div>
    </div>
  );
};

export default RoomForms;
