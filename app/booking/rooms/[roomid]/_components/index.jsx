"use client";
import React from "react";
import Footer from "@/components/common/Footer";
import RoomInfo from "./Top";
export default function BookingItem() {
  return (
    <div className='bg-white'>
      <RoomInfo/>
      <Footer/>
    </div>
  );
}
