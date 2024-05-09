"use client";
import React, { useState } from "react";
import styled from "styled-components";
import Image from "next/image";
import { TiHome, TiMessage } from "react-icons/ti";
import { FiSettings } from "react-icons/fi";
import {
  FaRegUser,
  FaUserCircle,
  FaUsers,
  FaHistory,
  FaChartLine,
  FaPhoneAlt,
  FaHotel,
} from "react-icons/fa";
import { RxTimer } from "react-icons/rx";
// import { useAppSelector } from "@/hooks/reduxtoolkit";
import Link from "next/link";

const AdminSidebarData = [
  {
    id: 1,
    tab: {
      title: "Dashboard",
      path: "",
      icon: <TiHome fontSize={"26px"} />,
    },
    list: [],
  },
  {
    id: 6,
    tab: {
      icon: <FaHotel fontSize={"20px"} />,
      title: "Reservation",
      path: "reservation",
    },
    list: [],
  },
  {
    id: 4,
    tab: {
      icon: <FaRegUser fontSize={"20px"} />,
      title: "Clients",
      path: "customers",
    },
    list: [],
  },
];

const DashboardSidebar = ({ active }) => {
  // const { userInfo } = useAppSelector((store) => store.auth);
  const userInfo = {};
  const [activeindex, setActiveIndex] = useState(null);
  return (
    <HeaderStyles className={`w-full flex column gap-2`}>
      <div className="w-full h-full py-4 justify-between flex items-center flex-col gap-4">
        <div className="w-full h-[90%] flex flex-col gap-8">
          <div className="flex flex-col w-full items-start justify-between py-1">
            {/* <h4 className="text-3xl font-bold text-dark">RockTrading</h4> */}
            <div className=" w-[90%] mx-auto relative flex gap-1 items-center justify-between">
              <div className="w-full flex items-center gap-1 justify-start">
                <Image
                  alt="Cotion"
                  width={0}
                  sizes="100vw"
                  height={0}
                  loading="lazy"
                  src="https://www.hopper.com/assets/treasure-D-5S8iOp.svg"
                  className="w-14 h-14 rounded-full object-cover"
                />
                <h4 className="hidden md:flex flex-col text-lg font-bold text-dark">
                  HOME & VILLAS{" "}
                  <span className="block font-bold text-xs font-booking_font1">
                    {" "}
                    Benneth Okeke
                  </span>
                </h4>
              </div>
            </div>
          </div>
          <div className="w-full my-4 flex flex-col gap-2">
            {AdminSidebarData?.map((x, index) => {
              return (
                <div key={index} className="w-[90%] mx-auto">
                  {x?.list?.length === 0 ? (
                    <Link
                      className={
                        "text-3xl w-[90%] mx-auto text-dark family1 font-normal"
                      }
                      href={`/dashboard/${x.tab.path}`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="w-12 h-12 text-xm rounded-xl flex items-center text-blue justify-center">
                          {" "}
                          {x.tab.icon}
                        </span>
                        {<h4>{x.tab?.title}</h4>}
                      </div>
                    </Link>
                  ) : (
                    <div
                      onClick={() =>
                        setActiveIndex(activeindex === x?.id ? false : x?.id)
                      }
                      className="overflow-hidden"
                    >
                      <div className="tab text-3xl font-booking_font2 text-dark font-normal cursor-pointer family1 justify-between w-full">
                        <div className="flex items-center gap-1">
                          <span className="w-12 h-12 text-xm rounded-xl flex items-center text-blue justify-center">
                            {x?.tab?.icon}
                          </span>
                          {<h4>{x?.tab?.title}</h4>}
                        </div>
                        {/* {activeindex ? <BiChevronDown /> : <BiChevronUp />} */}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full items-start justify-between py-1">
          <div className="w-[90%] mx-auto flex flex-col gap-4">
            <Link
              className={
                "text-3xl flex items-center gap-4 p-[6px] px-4 font-booking_font2 text-dark family1 font-normal"
              }
              href={`/dashboard/settings`}
            >
              <FiSettings fontSize={"24px"} />
              Settings
            </Link>
            <div className=" w-full relative px-2 flex gap-1 items-center justify-between">
              <div className="flex flex-1 gap-2 items-center">
                <img
                  src="https://fundednext.fra1.digitaloceanspaces.com/dashboard/demo-avatar.jpg"
                  alt=""
                  className="w-10 rounded-full"
                />
                <h4 className="text-base text-dark font-bold family1">
                  {userInfo?.fullname || "Jermiah frim"}
                  <span className="block font-normal text-sm text-dark">
                    {userInfo?.email || "jerrme@gmail.com"}
                  </span>
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HeaderStyles>
  );
};

export const HeaderStyles = styled.div`
  width: 350px;
  /* position: absolute;
  top: 0;
  left: 0; */
  position: sticky;
  background-color: #fff;
  height: 100%;
  bottom: 0;
  border-right: 1px solid rgba(0,0,0,.09);
  .dropdown {
    max-height: 0;
    transition: all 0.7s;
    /* min-height: 0; */
    &.active {
      max-height: 450px;
      /* min-height: 100px; */
    }
  }
  a,
  .tab {
    /* padding: 4px; */
    /* min-height: 4rem; */
    font-weight: bold;
    margin: 0 auto;
    font-size: 15px;
    border-radius: 10px;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;

    svg {
      color: #000;
    }

    &:hover {
      background: rgb(231, 231, 231);
      svg {
        color: #000;
      }
    }
    &.active {
      position: relative;
      background: rgb(231, 231, 231);

      span {
        svg {
          color: #000;
        }
      }
    }
  }
`;

export default DashboardSidebar;
