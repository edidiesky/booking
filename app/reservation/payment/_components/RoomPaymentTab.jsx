"use client";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import Skeleton from "react-loading-skeleton";
import useGetReservationById from "@/app/hooks/useGetReservationById";
export default function RoomPaymentTab() {
  // get the reservation Id from the search parameter
  const searchParams = useSearchParams();
  const reservationId = searchParams.get("reservationId");
  //  console.log(reservationId);

  const { room, loading } = useGetReservationById(reservationId);
  const startDate = moment(room?.startDate).format("MMMM Do");
  const endDate = moment(room?.endDate).format("MMMM Do");
  let date1 = moment(room?.startDate, "MMMM Do YYYY, h:mm:ss a");
  let date2 = moment(room?.endDate, "MMMM Do YYYY, h:mm:ss a");
  const differenceInDays = date1;// Convert milliseconds to days
  console.log(differenceInDays);
  return (
    <>
      {loading ? (
        <div className="w-full shadow-lg flex flex-col gap-2">
          <Skeleton width={"100%"} height={260} />
          <Skeleton width={"60%"} height={30} />
          <Skeleton width={"40%"} height={10} />
          <div className="w-full flex items-center justify-between gap-2">
            <Skeleton width={"40%"} height={10} />
            <Skeleton width={"40%"} height={10} />
          </div>
          <div className="w-full flex items-center justify-between gap-2">
            <Skeleton width={"40%"} height={10} />
            <Skeleton width={"40%"} height={10} />
          </div>{" "}
          <div className="w-full flex items-center justify-between gap-2">
            <Skeleton width={"40%"} height={10} />
            <Skeleton width={"40%"} height={10} />
          </div>
          <Skeleton width={"100%"} height={40} />
        </div>
      ) : (
        <div className="w-full flex-col gap-8">
          <div className="border shadow-xl rounded-xl overflow-hidden flex flex-col w-full">
            <Image
              alt="Cotion"
              width={0}
              sizes="100vw"
              height={0}
              loading="lazy"
              src={room?.rooms?.images[0]}
              className="image object-cover w-full h-[300px]"
            />
            <div className="w-full flex flex-col gap-2">
              <div className="flex p-8 pb-6 border-b-4 flex-col w-full gap-2">
                <span className="text-sm font-booking_font font-normal">
                  1 Bedroom | 3 Guests
                </span>
                <h1 className="text-3xl w-full font-medium font-booking_font4">
                  {room?.rooms?.title}
                </h1>
                <span className="text-sm font-booking_font font-normal">
                  {room?.rooms?.address}, {room?.rooms?.city}
                </span>
                {/* date and guests */}
                <div className="py-3 flex items-center justify-between w-full">
                  {/* date */}
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-booking_font_bold font-bold">
                      Dates
                    </span>
                    <span className="text-base font-booking_font font-normal">
                      {startDate} - {endDate}
                    </span>
                  </div>

                  {/* guests */}
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-booking_font_bold font-bold">
                      Guests
                    </span>
                    <span className="text-base font-booking_font font-normal">
                      1 guest
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full flex p-4 pb-6 px-8 border-b-4 flex-col gap-2">
                {/* price */}
                <div className="w-full text-base font-light font-booking_font flex items-center justify-between">
                  <span>238.20 x 2 nights</span>
                  <span>
                    476.40 <span className="text-base">USD</span>
                  </span>
                </div>
                {/* taxes */}
                <div className="w-full text-base pb-4 font-light font-booking_font flex items-center justify-between">
                  <span>Fees and taxess</span>
                  <span>
                    476.40 <span className="text-base">USD</span>
                  </span>
                </div>
                {/* total */}
                <div className="w-full text-lg font-light font-booking_font pt-4 border-t flex items-center justify-between">
                  <span className="font-bold font-booking_font_bold">
                    Total Cash
                  </span>
                  <span className="font-bold font-booking_font_bold">
                    476.40{" "}
                    <span className="text-base font-light font-booking_font">
                      USD
                    </span>
                  </span>
                </div>
              </div>
              <div className="w-full flex p-4 px-8 flex-col gap-2">
                {/* price */}
                <div className="w-full text-lg font-light font-booking_font flex items-center justify-between">
                  <span className="font-bold font-booking_font_bold">
                    Total Cash
                  </span>
                  <span className="font-bold font-booking_font_bold">
                    476.40{" "}
                    <span className="text-base font-light font-booking_font">
                      USD
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
