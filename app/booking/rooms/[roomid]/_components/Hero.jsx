"use client";
import React, { useRef, useEffect, useState } from "react";
export default function Hero() {
  const container = useRef(null);
  const [childrens, setChildrens] = useState(1);
  return (
    <>
      <div className="w-[90%] rounded-3xl shadow-2xl -mt-[100px] relative z-[50] left-0 right-0 mx-auto max-w-custom p-8 bg-white"></div>
    </>
  );
}
