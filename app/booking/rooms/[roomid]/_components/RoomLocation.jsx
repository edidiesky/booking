"use client";
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { slideup } from "@/constants/utils/framer";
import Skeleton from "react-loading-skeleton";
import dynamic from "next/dynamic";
const ReactleafletImport = dynamic(() => import("react-leaflet"), {
  ssr: false,
});
const leafletImport = dynamic(() => import("leaflet"), { ssr: false });
const { MapContainer, Marker, Popup, TileLayer } = ReactleafletImport;
const { Icon } = leafletImport;
// import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
// import { Icon } from "leaflet";
export default function RoomLocation({ loading, room }) {
  const ctaText_1 = useRef(null);
  const inView = useInView(ctaText_1, {
    margin: "0px 100px -50px 0px",
  });

  const ctaText1 = "The location";

  const customIcon = new Icon({
    iconUrl: "/images/location.png",
    iconSize: [40, 40],
  });

  return (
    <>
      <div className="w-full pb-24">
        <div className="w-[90%] mx-auto max-w-custom_2">
          <div className="w-full flex flex-col gap-8">
            <h3
              ref={ctaText_1}
              className="text-4xl font-bold flex flex-wrap 
              gap-x-[8px] gap-y-[8px]  leading-[1] font-booking_font4"
            >
              {ctaText1.split(" ").map((x, index) => {
                return (
                  <span key={index} className="inline-flex hide relative">
                    <motion.span
                      variants={slideup}
                      custom={index}
                      initial="initial"
                      animate={inView ? "animate" : "exit"}
                    >
                      {x}
                    </motion.span>
                  </span>
                );
              })}
            </h3>
            {loading ? (
              <Skeleton width={"100%"} height={520} />
            ) : (
              <div className="w-full h-[600px] overflow-hidden flex items-center justify-center bg-[#fafafa] rounded-xl">
                <MapContainer
                  style={{ height: "100%", width: "100%" }}
                  center={[room?.latitude, room?.longitude]}
                  zoom={13}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker
                    position={[room?.latitude, room?.longitude]}
                    icon={customIcon}
                  >
                    <Popup>
                      <div className="w-[400px] rounded-2xl shadow-2xl flex flex-col gap-1">
                        <img src={room?.images[0]} alt="" className="w-full" />

                        <div className="flex flex-col">
                          <h4 className="text-xl font-bold">{room?.title}</h4>
                          <h5 className="text-base font-normal text-grey">
                            ${room?.price}
                          </h5>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
