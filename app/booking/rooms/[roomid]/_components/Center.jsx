"use client";
import React, { useRef, useEffect, useState } from "react";
export default function RoomCenter() {
  const container = useRef(null);
  const [childrens, setChildrens] = useState(1);
  return (
    <>
      <div className="w-full py-20">
        <h3 className="text-5xl">Room Center</h3>
      </div>
    </>
  );
}
