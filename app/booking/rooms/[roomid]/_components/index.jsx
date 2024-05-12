"use client";
import React from "react";
import Hero from "./Hero";
import Footer from "@/components/common/Footer";
import RoomInfo from "./Top";
import Navbar from "@/components/common/Navbar";
export default function BookingItem() {
  return (
    <div className='bg-white'>
      <Navbar/>
      <RoomInfo/>
      <Footer/>
    </div>
  );
}
