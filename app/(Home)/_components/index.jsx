"use client";
import React from "react";
import Hero from "./Hero";
import Work from "./Work";
import Cta from "./Cta";

export default function HomeIndex() {
  return (
    <div>
      <Hero />
      <Cta />
      <Work />
    </div>
  );
}
