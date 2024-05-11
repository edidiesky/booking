"use client";
import React, { useState } from "react";
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
];

const RoomsList = () => {
  //   const [roommodal, setRoomModal] = useState(false);
  return (
    <div className="w-full p-6 border rounded-[20px]">
      <Table>
        <div className="TableContainer">
          <table className="tableWrapper">
            <thead>
              <tr>
                {/* <th>ID</th> */}
                <th>Investor</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Role</th>
                <th>Date</th>
                <th>Manage</th>
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
    </div>
  );
};

export default RoomsList;
