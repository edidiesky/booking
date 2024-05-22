"use client";
import React from "react";
import Footer from "@/components/common/Footer";
import RoomInfo from "./Top";
import getCurrentUserSession from "@/app/actions/getCurrentUser";
export default function BookingItem() {
  
  return (
    <div className='bg-white'>
      <RoomInfo/>
    </div>
  );
}
