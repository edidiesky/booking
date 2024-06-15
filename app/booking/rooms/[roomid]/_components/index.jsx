"use client";
import React from "react";
import Hero from "./Hero";
import RoomLists from "./RoomLists";
import RecommendedList from "./RecommendedList";
import Loader from "@/components/loader";
import useGetRoomById from "@/app/hooks/useGetRoomById";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
export default function BookingItem({ roomid, currentUser }) {
  const { loading, room } = useGetRoomById(roomid);
  if (loading) {
    return <Loader />;
  }
  return (
    <div>
      <Navbar currentUser={currentUser} />
      <Hero room={room} />
      {/* <RoomLists currentUser={currentUser} loading={loading} room={room} />
      <RecommendedList
        currentUser={currentUser}
        loading={loading}
        room={room}
      /> */}
      <RoomLists currentUser={currentUser} loading={loading} room={room} />
      <RecommendedList
        currentUser={currentUser}
        loading={loading}
        room={room}
      />
      <Footer />
    </div>
  );
}
