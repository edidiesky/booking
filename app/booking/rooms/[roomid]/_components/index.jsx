
import React from "react";
import Footer from "@/components/common/Footer";
import RoomInfo from "./Top";
import getCurrentUserSession from "@/app/actions/getCurrentUser";
export default async function BookingItem() {
    const currentUser = await getCurrentUserSession();
  return (
    <div className="bg-white">
      <RoomInfo currentUser={currentUser} />
      <Footer />
    </div>
  );
}
