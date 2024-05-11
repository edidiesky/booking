"use client"
import React, {useState} from 'react';
import { motion, useInView, AnimatePresence, Variant } from "framer-motion";
import ReservationRoomsModal from '@/components/modals/ReservationRoomsModal';
const DashboardIndex = () => {
  const [reservationmodal, setReservationModal] = useState(false)
    return (
      <div className="w-full">
        <AnimatePresence mode="wait">
          {reservationmodal && (
            <ReservationRoomsModal
              modal={reservationmodal}
              setModal={setReservationModal}
            />
          )}
        </AnimatePresence>
        <div className="w-full flex flex-col gap-12">
          <div className="w-full flex items-center justify-between">
            <h3 className="text-3xl font-booking_font font-normal">
              My Reservation
            </h3>
            <div
              onClick={() => setReservationModal(true)}
              className="p-4 cursor-pointer text-base
             bg-[#000] px-8 font-booking_font rounded-[40px] font-bold text-white"
            >
              Add a reservation
            </div>
          </div>
        </div>
      </div>
    );
}

export default DashboardIndex;