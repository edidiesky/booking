"use client";
import React, { useState, useEffect } from "react";
import { useAppSelector } from "@/app/hooks/useCustomRedux";

import { BiSearch } from "react-icons/bi";
import { AnimatePresence, Variant } from "framer-motion";
import ReservationRoomsModal from "@/components/modals/ReservationRoomsModal";
import { Table } from "@/components/common/styles";
import TableCard from "@/components/common/TableCard";
import useRooms from "@/app/hooks/useRooms";
import Loader from "@/components/loader";

const RoomsList = () => {
  //   const [roommodal, setRoomModal] = useState(false);
  const {
    rooms,
    getallRoomisLoading,
  } = useAppSelector((store) => store.room);
  return (
    <>
      {getallRoomisLoading && <Loader />}
      <div className="w-full p-4 px-6 border rounded-[20px]">
        <label
          htmlFor=""
          className="hidden md:flex text-xl text-dark w-[200px] lg:w-[250px]
             items-center gap-2 h-12 border rounded-[10px] bg-[#f9f9f9] px-4"
        >
          <div className="text-dark flex items-center justify-center">
            <BiSearch />
          </div>
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent border-none outline-none text-base text-dark flex-1"
          />
        </label>
        <Table>
          <div className="TableContainer">
            <table className="tableWrapper">
              <thead>
                <tr>
                  {/* <th>ID</th> */}
                  <th>Room Name</th>
                  <th>Location</th>
                  <th>city</th>
                  <th>Date Created</th>
                  <th>Manage Room</th>
                </tr>
              </thead>
              <tbody>
                {rooms?.map((x, index) => {
                  return <TableCard x={x} type={"rooms"} key={x?._id} />;
                })}
              </tbody>
            </table>
          </div>
        </Table>
        <div className="w-full flex items-center justify-end gap-2">
          <div className="p-3 rounded-2xl text-sm font-bold font-booking_font_bold px-8 border hover:opacity-[.8] cursor-pointer border-[rgba(0,0,0,0.3)]">
            Previous
          </div>
          <div className="p-3 rounded-2xl text-sm font-bold font-booking_font_bold px-8 border hover:opacity-[.8] cursor-pointer border-[rgba(0,0,0,0.3)]">
            Next
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomsList;
