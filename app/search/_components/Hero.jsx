"use client";
import React, { useRef, useEffect, useState } from "react";
import { IoCalendarOutline } from "react-icons/io5";
import { MdPerson2 } from "react-icons/md";
import { slideup, slideup3 } from "@/constants/utils/framer";

import { FiSend } from "react-icons/fi";
import { motion, useInView, AnimatePresence, Variant } from "framer-motion";
import GuestsModal from "@/components/modals/Guests";
import DateModal from "@/components/modals/Date";

const selectionData = [
  {
    id: 1,
    title: "Location",
    icon: <FiSend fontSize={"20px"} />,
    subTitle: "Where are you going?",
  },
  {
    id: 2,
    title: "Check In - Check Out",
    icon: <IoCalendarOutline fontSize={"20px"} />,
    subTitle: "Add your desired date!",
  },
  {
    id: 4,
    title: "Travelers",
    icon: <MdPerson2 fontSize={"20px"} />,
    subTitle: "Add Guests",
  },
];
export default function Hero() {
  const container = useRef(null);
  const [datemodal, setDateModal] = useState(false);
  const [guestsmodal, setGuestsModal] = useState(false);

  // data for filtering
  const [childrens, setChildrens] = useState(1);
  const [infants, setInfants] = useState(0);
  const [adults, setAdults] = useState(2);

  const [dateRange, setDateRange] = useState({
    selection: {
      startDate: null,
      endDate: null,
      key: "selection",
    },
  });

  const handleSelect = (ranges) => {
    // console.log(ranges);
    const selectedStartDate = ranges?.range1?.startDate;
    const selectedendDate = ranges?.range1?.endDate;
    console.log(selectedStartDate, selectedendDate, ranges);

    setDateRange({
      ...dateRange,
      selection: {
        startDate: selectedStartDate,
        endDate: selectedendDate,
      },
    });
  };
  // console.log(dateRange);

  const inView1 = useInView(container, {
    margin: "0px 100px -50px 0px",
  });

  const handleModalSelection = (id) => {
    if (id === 4) {
      setGuestsModal(true);
    }
    if (id === 2) {
      setDateModal(true);
    }
  };

  // console.log(datemodal);
  return (
    <>
      {/* guests modal */}
      <AnimatePresence mode="wait">
        {guestsmodal && (
          <GuestsModal
            setChildrens={setChildrens}
            childrens={childrens}
            adults={adults}
            setAdults={setAdults}
            modal={guestsmodal}
            setModal={setGuestsModal}
          />
        )}
      </AnimatePresence>
      {/* date modal */}
      <AnimatePresence mode="wait">
        {datemodal && (
          <DateModal
           
            setAdults={setAdults}
            modal={datemodal}
            setModal={setDateModal}
            handleSelect={handleSelect}
            dateRange={dateRange}
          />
        )}
      </AnimatePresence>

      <div
        data-scroll
        className="min-h-[100vh] z-40 relative flex flex-col items-center justify-center"
      >
        <div
          style={{
            background:
              "linear-gradient(270deg, rgba(28, 28, 28, 0) 0%, rgba(28, 28, 28, 0.33) 38.82%, rgba(28, 28, 28, 0.73) 100%)",
          }}
          className="w-full z-20 h-full absolute"
        ></div>
        <img
          src="https://homes-and-villas.marriott.com/assets/images/promotions/DEFAULT_DESKTOP.png?imwidth=1600"
          alt=""
          className="w-full z-10 h-full object-cover absolute top-0 left-0"
        />

        <div className="w-full h-100 relative z-30 flex flex-col items-start">
          <div className="w-[80%] max-w-custom mx-auto">
            <div className=" flex flex-col gap-8">
              <h1 className="text-7xl w-100 text-white font-medium font-booking_font3">
                Trusted homes <br /> backed by Marriott
              </h1>
              <h4 className="text-xl font-medium text-grey font-booking_font2">
                Earn and redeem points on premium vacation rentals
              </h4>
              <div className="w-full flex">
                <div className="p-[20px] cursor-pointer text-base bg-[#C5F244] px-8 rounded-[40px] font-bold text-dark">
                  Start Your Search
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-[90%] rounded-3xl shadow-2xl -mt-[100px] relative z-[50] left-0 right-0 mx-auto max-w-custom p-8 bg-white">
        <div className="w-[95%] md:w-[90%] py-4 md:py-8 mx-auto flex flex-col gap-8">
          <div className="flex items-center gap-8">
            <h4 className="text-base font-extrabold pb-4 rounded border-b-4 border-[rgba(0,0,0,1)] text-dark font-booking_font2">
              Stays
            </h4>
          </div>

          {/* search input */}
          <div
            ref={container}
            className="w-full grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4"
          >
            {selectionData?.map((data, index) => {
              return (
                <motion.div
                  key={index}
                  variants={slideup3}
                  custom={index}
                  initial="initial"
                  animate={inView1 ? "animate" : "exit"}
                  onClick={() => handleModalSelection(data.id)}
                  className="border cursor-pointer p-4 md:p-6 rounded-3xl md:flex-row flex-col flex items-start md:items-center gap-4"
                >
                  {data.icon}
                  <h4 className="text-lg md:text-xl flex-1 font-bold font-booking_font2">
                    {data.title}
                    <span className="block text-xs leading-[1.2] font-booking_font4 font-normal text-grey">
                      {data.subTitle}
                    </span>
                  </h4>
                </motion.div>
              );
            })}
          </div>

          <div className="w-full justify-end flex">
            <div className="p-3 cursor-pointer bg-[#C5F244] px-8 rounded-[40px] font-bold text-dark">
              Search
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
