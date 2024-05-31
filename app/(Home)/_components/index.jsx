"use client";
import React from "react";
import Hero from "./Hero";
import Work from "./Work";
import Cta from "./Cta";

export default function HomeIndex({ currentUser }) {
  return (
    <div>
      <Hero />
      <Cta currentUser={currentUser} />
      <Work />
    </div>
  );
}
