"use client";
import React, { useState } from "react";
import { BiSearch } from "react-icons/bi";
import { AnimatePresence, Variant } from "framer-motion";
import ReservationRoomsModal from "@/components/modals/ReservationRoomsModal";
import { Table } from "@/components/common/styles";
import TableCard from "@/components/common/TableCard";

const rooms = [
  {
    title: "Villa Borghese Luxury",
    type: "rooms",
    price: 44.8,
    location: "3776 Bingamon Branch Rome",
    city: "Rome",
    country: "Italy",
    host_Id: "64eb2adc634a3fec2d49c12d",
    beds: 6,
    bathrooms: 10,
    bedrooms: 4,
    endDate: "8/24/2024",
    startDate: "4/24/2024",
    image: [
      "https://a0.muscache.com/im/pictures/miso/Hosting-919391066738299347/original/42fad312-c1f9-49d0-a3c7-d489720a6d84.jpeg?im_w=720",
    ],
  },
  {
    title: " Borghese Luxury",
    type: "rooms",
    price: 44.8,
    location: "3776 Bingamon Branch Rome",
    city: "Rome",
    country: "Italy",
    host_Id: "64eb2adc634a3fec2d49c12d",
    beds: 6,
    bathrooms: 10,
    bedrooms: 4,
    endDate: "8/24/2024",
    startDate: "4/24/2024",
    image: [
      "https://a0.muscache.com/im/pictures/miso/Hosting-919391066738299347/original/42fad312-c1f9-49d0-a3c7-d489720a6d84.jpeg?im_w=720",
    ],
  },
  {
    title: "Villa Borghese Luxury",
    type: "rooms",
    price: 44.8,
    location: "3776 Bingamon Branch Rome",
    city: "Rome",
    country: "Italy",
    host_Id: "64eb2adc634a3fec2d49c12d",
    beds: 6,
    bathrooms: 10,
    bedrooms: 4,
    endDate: "8/24/2024",
    startDate: "4/24/2024",
    image: [
      "https://a0.muscache.com/im/pictures/miso/Hosting-919391066738299347/original/42fad312-c1f9-49d0-a3c7-d489720a6d84.jpeg?im_w=720",
    ],
  },
  // {
  //   title: " Borghese Luxury",
  //   type: "rooms",
  //   price: 44.8,
  //   location: "3776 Bingamon Branch Rome",
  //   city: "Rome",
  //   country: "Italy",
  //   host_Id: "64eb2adc634a3fec2d49c12d",
  //   beds: 6,
  //   bathrooms: 10,
  //   bedrooms: 4,
  //   endDate: "8/24/2024",
  //   startDate: "4/24/2024",
  //   image: [
  //     "https://a0.muscache.com/im/pictures/miso/Hosting-919391066738299347/original/42fad312-c1f9-49d0-a3c7-d489720a6d84.jpeg?im_w=720",
  //   ],
  // },
];

const RoomsList = () => {
  //   const [roommodal, setRoomModal] = useState(false);
  return (
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
          placeholder="Search for customers"
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
                <th>Capacity</th>
                <th>Location</th>
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
        <div className="p-4 rounded-2xl text-base font-bold px-8 border hover:opacity-[.8] cursor-pointer border-[rgba(0,0,0,0.3)]">
          Previous
        </div>
        <div className="p-4 rounded-2xl text-base font-bold px-8 border hover:opacity-[.8] cursor-pointer border-[rgba(0,0,0,0.3)]">
          Next
        </div>
      </div>
    </div>
  );
};

export default RoomsList;
