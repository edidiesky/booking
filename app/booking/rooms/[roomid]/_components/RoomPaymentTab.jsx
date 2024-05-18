"use client";
import React, { useRef, useState } from "react";
import { BiChevronDown } from "react-icons/bi";
import moment from "moment";
export default function RoomPaymentTab({
  setAdults,
  datemodal,
  setDateModal,
  handleSelect,
  dateRange,
  adults,
  setChildrens,
  childrens,
  guestsmodal,
  setGuestsModal,
  loginmodal,
  setLoginModal,
  currentUser,
}) {
  const formatDate = (date) => {
    return moment(date).format("MMM D");
  };
  const differnceinDays = Math.round(
    (moment(dateRange?.selection?.endDate, "MMMM Do YYYY") -
      moment(dateRange?.selection?.startDate, "MMMM Do YYYY")) /
      (1000 * 3600 * 24)
  );
  const limit = childrens + adults;
  const handleReservationBooking = () => {
    if (currentUser) {
      // console.log('Reservation has been booked')
      window.location.href = `/reservation/payment`;
    } else {
      setLoginModal(true);
    }
  };
  return (
    <div className="w-full flex-col gap-8">
      <div className="p-8 border shadow rounded-xl flex flex-col w-full">
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
              className="dateWrapper flex items-center gap-1 justify-space"
            >
              <div
                style={{ padding: ".7rem", lineHeight: "20px" }}
                className="text-sm flex-1 text-extra-bold "
              >
                <div className="text-sm block capitalize text-dark text-light">
                  <span className="uppercase text-sm block">check-in</span>
                  {formatDate(dateRange?.selection?.startDate)}
                </div>
              </div>{" "}
              <div
                style={{
                  padding: ".7rem",
                  borderLeft: "1px solid rgba(0,0,0,.3)",
                  height: "100%",
                  lineHeight: "20px",
                }}
                className=" text-sm text-start flex-1 wrap text-extra-bold "
              >
                <div className="fs-12 block capitalize text-dark text-light">
                  <span className="uppercase text-sm block">check-out</span>
                  {formatDate(dateRange?.selection?.endDate)}
                </div>
              </div>
            </div>{" "}
            {/* rooms */}
            <div
              onClick={() => setGuestsModal(true)}
              style={{
                border: "1px solid rgba(0,0,0,.3)",
                borderBottomRightRadius: "8px",
                borderBottomLeftRadius: "8px",
              }}
              className="dateWrapper flex items-center gap-1 justify-space"
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
          <div className="w-full flex flex-col gap-2">
            {/* price */}
            <div className="w-full text-basesm font-light font-booking_font_normal flex items-center justify-between">
              <span>238.20 x 2 nights</span>
              <span>
                476.40 <span className="text-base">USD</span>
              </span>
            </div>
            {/* taxes */}
            <div className="w-full text-base font-light font-booking_font_normal flex items-center justify-between">
              <span>Fees and taxess</span>
              <span>
                476.40 <span className="text-lg">USD</span>
              </span>
            </div>
            {/* total */}
            <div className="w-full text-base font-light font-booking_font_normal flex items-center justify-between">
              <span>Total</span>
              <span>
                476.40 <span className="text-lg">USD</span>
              </span>
            </div>
          </div>
          {/* summary */}
          <div
            className="w-full text-xl font-bold font-booking_font1
                    flex items-center justify-between"
          >
            <span>You Pay</span>
            <span>
              789.85 <span className="text-base">USD</span>
            </span>
          </div>
          {currentUser ? (
            <div
              // onClick={handleReservationBooking}
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
