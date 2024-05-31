"use client";
import React from "react";
import Cta from "./Cta";
export default function HomeIndex({ currentUser }) {
  return (
    <div>
      <Cta currentUser={currentUser} />
    </div>
  );
}
