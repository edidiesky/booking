"use client";
import React from "react";
import Hero from "./Hero";
import Map from "./Map";
import Footer from "@/components/common/Footer";

export default function HomeIndex() {
  return (
    <div className="w-full">
      <div className="grid py-8 min-h-[70vh] p-6 bg-[#fafafa] w-full md:grid-cols-2">
        <Hero />
        <Map />
      </div>
      <Footer />
    </div>
  );
}
