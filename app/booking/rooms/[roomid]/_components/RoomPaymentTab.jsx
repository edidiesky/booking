"use client";
import React, { useRef, useState } from "react";
import { BiChevronDown } from "react-icons/bi";
import moment from "moment";
import axios from "axios";
import toast from "react-hot-toast";
export default function RoomPaymentTab({
  setDateModal,
  dateRange,
  adults,
  childrens,
  setGuestsModal,
  setLoginModal,
  currentUser,
  room,
}) {

  const [bookingloading, setBookingLoading] = useState(false)
  const [bookingsuccess, setBookingSuccess] = useState(false)
  const formatDate = (date) => {
    return moment(date).format("MMM D");
  };
  const differenceinDays = Math.round(
    (moment(dateRange?.selection?.endDate, "MMMM Do YYYY") -
      moment(dateRange?.selection?.startDate, "MMMM Do YYYY")) /
      (1000 * 3600 * 24)
  );
  const limit = childrens + adults;

  const totalPrice =
    room?.price * differenceinDays + room?.price * differenceinDays * 0.1;
  const reservationData = {
    totalPrice: totalPrice,
    startDate: moment(dateRange?.selection?.startDate, "MMMM Do YYYY"),
    endDate: moment(dateRange?.selection?.endDate, "MMMM Do YYYY"),
  };
  const handleReservationBooking = () => {
    if (currentUser) {
      // console.log('Reservation has been booked')
      // window.location.href = `/reservation/payment`;
      if (differenceinDays <= 2) {
        toast.error("Reservation date should be more than 2 days");
      } else {
        // toast.success("Reservation date is fine");
        const { data } = axios
          .post(`/api/reservation/${room?.id}`, reservationData)
          .then(() => {
            // setModal(false);
          })
          .catch((error) => {
            const erroMessage = error?.response?.data?.message || "An error occurred"
            toast.error(erroMessage);
            // console.log(error);
          })
          .finally(() => {
            // setLoading(false);
          });
      }
    } else {
      setLoginModal(true);
    }
  };
  // console.log(moment(dateRange?.selection?.startDate).format("MMM D"));
  return (
    <div className="w-full flex-col gap-8">
      <div className="p-8 border border-[rgba(0,0,0,.4)] shadow rounded-xl flex flex-col w-full">
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col w-full">
            <div
              onClick={() => setDateModal(true)}
              style={{
                border: "1px solid rgba(0,0,0,.5)",
                borderBottom: "none",
                borderTopRightRadius: "8px",
                borderTopLeftRadius: "8px",
              }}
              className="dateWrapper cursor-pointer flex items-center gap-1 justify-space"
            >
              <div
                style={{ padding: ".7rem", lineHeight: "20px" }}
                className="text-sm flex-1 text-extra-bold "
              >
                <div className="text-sm block capitalize text-dark text-light">
                  <span className="uppercase text-sm block">check-in</span>
                  {formatDate(dateRange?.selection?.startDate) !==
                  "Invalid date"
                    ? formatDate(dateRange?.selection?.startDate)
                    : "Add Date"}
                </div>
              </div>{" "}
              <div
                style={{
                  padding: ".7rem",
                  borderLeft: "1px solid rgba(0,0,0,.6)",
                  height: "100%",
                  lineHeight: "20px",
                }}
                className=" text-sm text-start flex-1 wrap text-extra-bold "
              >
                <div className="fs-12 block capitalize text-dark text-light">
                  <span className="uppercase text-sm block">check-out</span>
                  {formatDate(dateRange?.selection?.endDate) !== "Invalid date"
                    ? formatDate(dateRange?.selection?.endDate)
                    : "Add Date"}
                </div>
              </div>
            </div>{" "}
            {/* rooms */}
            <div
              onClick={() => setGuestsModal(true)}
              style={{
                border: "1px solid rgba(0,0,0,.6)",
                borderBottomRightRadius: "8px",
                borderBottomLeftRadius: "8px",
              }}
              className="dateWrapper cursor-pointer flex items-center gap-1 justify-space"
            >
              <div
                style={{ padding: ".7rem" }}
                className=" text-sm flex-1 text-extra-bold text-bold"
              >
                GUESTS
                <div className="text-sm block text-dark text-light">
                  {limit} guests
                </div>
              </div>{" "}
              <div
                style={{
                  padding: ".7rem",
                  height: "100%",
                }}
                className=" text-sm flex items-center justify-end"
              >
                <div className="icon flex items-center justify-end">
                  <BiChevronDown fontSize={"24px"} />
                </div>
              </div>
            </div>
          </div>
          {formatDate(dateRange?.selection?.startDate) !== "Invalid date" && (
            <>
              <div className="w-full flex flex-col gap-2">
                {/* price */}
                <div className="w-full text-base font-light font-booking_font_normal flex items-center justify-between">
                  <span>
                    {room?.price} x {differenceinDays} nights
                  </span>
                  <span>
                    {room?.price * differenceinDays}{" "}
                    <span className="text-base">USD</span>
                  </span>
                </div>
                {/* taxes */}
                <div className="w-full text-base font-light font-booking_font_normal flex items-center justify-between">
                  <span>Fees and taxess</span>
                  <span>
                    {room?.price * differenceinDays * 0.1}{" "}
                    <span className="text-lg">USD</span>
                  </span>
                </div>
                {/* total */}
                <div className="w-full text-base font-light font-booking_font_normal flex items-center justify-between">
                  <span>Total</span>
                  <span>
                    {totalPrice} <span className="text-lg">USD</span>
                  </span>
                </div>
              </div>
              {/* summary */}
              <div
                className="w-full text-xl font-bold font-booking_font_bold
                    flex items-center justify-between"
              >
                <span>You Pay</span>
                <span>
                  {totalPrice} <span className="text-base">USD</span>
                </span>
              </div>
            </>
          )}
          {formatDate(dateRange?.selection?.startDate) !== "Invalid date" ? (
            <>
              {currentUser ? (
                <div
                  onClick={handleReservationBooking}
                  className="btn bg-[#494BA2] p-6 cursor-pointer px-8 text-base rounded-[10px] font-bold uppercase text-center text-white font-booking_font_normal"
                >
                  Place Reservation
                </div>
              ) : (
                <div
                  onClick={handleReservationBooking}
                  className="btn bg-[#494BA2] p-6 cursor-pointer px-8 text-base rounded-[10px] font-bold uppercase text-center text-white font-booking_font_normal"
                >
                  SIGN IN TO SAVE
                </div>
              )}
            </>
          ) : (
            <div
              onClick={() => setDateModal(true)}
              className="btn p-6 cursor-pointer px-8 
              text-base rounded-[10px] font-bold uppercase text-center text-white font-booking_font_normal"
            >
              Check for Availability
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col py-4 gap-4">
        <h4 className="text-xl text-center font-booking_font_normal">
          Have questions about this home?
        </h4>
        <div className="p-6 w-[90%] mx-auto font-booking_font_normal border-[rgba(0,0,0,1)] text-base text-center border uppercase">
          CONTACT PROPERTY MANAGER
        </div>
      </div>
    </div>
  );
}
