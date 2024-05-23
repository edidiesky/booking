
import React from "react";
import RoomInfo from "./Top";
import getCurrentUserSession from "@/app/actions/getCurrentUser";
export default async function BookingItem({ roomid }) {
  const currentUser = await getCurrentUserSession();
  return (
    <div className="bg-white">
      <RoomInfo currentUser={currentUser} roomid={roomid} />
    </div>
  );
}
