"use client";
import React from "react";
import Hero from "./Hero";
import Work from "./Work";
import Cta from "./Cta";
import Footer from "@/components/common/Footer";
import useRooms from "@/app/actions/useRooms";

export default function HomeIndex() {
  //  const { loading, error, rooms } = useRooms();

  //  console.log(loading, error, rooms);
  return (
    <div>
      <Hero />
      <Cta />
      <Work/>
      <Footer/>
    </div>
  );
}
