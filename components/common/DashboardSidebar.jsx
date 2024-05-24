"use client";
import React, { useState } from "react";
import styled from "styled-components";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { TiHome } from "react-icons/ti";
import { FiSettings } from "react-icons/fi";
import { LuBedDouble } from "react-icons/lu";
import { FaRegUser, FaHotel } from "react-icons/fa";
import Link from "next/link";

const AdminSidebarData = [
  {
    id: 1,
    tab: {
      title: "Dashboard",
      path: "",
      icon: <TiHome fontSize={"18px"} />,
    },
    list: [],
  },
  {
    id: 61,
    tab: {
      icon: <FaHotel fontSize={"16px"} />,
      title: "Rooms",
      path: "/rooms",
    },
    list: [],
  },
  {
    id: 6,
    tab: {
      icon: <LuBedDouble fontSize={"16px"} />,
      title: "Reservation",
      path: "/reservation",
    },
    list: [],
  },
  {
    id: 4,
    tab: {
      icon: <FaRegUser fontSize={"16px"} />,
      title: "Clients",
      path: "/customers",
    },
    list: [],
  },
];

const DashboardSidebar = ({ active, currentUser }) => {
  // const currentUser = {};
  const pathname = usePathname();
  return (
    <HeaderStyles className={`w-full flex column gap-2`}>
      <div className="w-full h-full py-4 justify-between flex items-center flex-col gap-4">
        <div className="w-full h-[90%] flex flex-col gap-8">
          <div className="flex flex-col w-full items-start justify-between py-1">
            {/* <h4 className="text-sm text-dark">RockTrading</h4> */}
            <div className=" w-[90%] mx-auto relative flex gap-4 items-center flex-col justify-between">
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
                <h4 className="hidden md:flex flex-col text-lg font-booking_font4 font-bold text-dark">
                  HOME & VILLAS{" "}
                  <span className="block text-xs font-booking_font">
                    {" "}
                    Benneth Okeke
                  </span>
                </h4>
              </div>
            </div>
          </div>
          <div className="w-full my-4 flex flex-col">
            {AdminSidebarData?.map((x, index) => {
              // console.log(pathname, `/dashboard${x.tab.path}`);
              return (
                <div
                  key={index}
                  className="w-[90%] font-booking_font_normal text-sm mx-auto"
                >
                  <Link
                    className={`
                      ${pathname === `/dashboard${x.tab.path}` ? "active" : ""}
                      text-sm w-[90%] mx-auto text-dark family1`}
                    href={`/dashboard${x.tab.path}`}
                  >
                    <div className="flex items-center">
                      <span className="w-12 h-12 text-xm rounded-xl flex items-center text-blue justify-center">
                        {" "}
                        {x.tab.icon}
                      </span>
                      {<h4>{x.tab?.title}</h4>}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full items-start justify-between py-1">
          <div className="w-[90%] mx-auto flex flex-col gap-4">
            <Link
              className={`${
                pathname === `/dashboard/settings` ? "active" : ""
              } text-sm flex items-center gap-4 p-[6px] px-4 font-booking_font_normal text-dark family1`}
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
                <h4 className="text-base text-dark font-booking_font4">
                  {currentUser?.name}
                  <span className="block font-booking_font text-sm text-grey">
                    {currentUser?.email}
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
  width: 320px;
  position: sticky;
  top: 0;
  height: 100vh;
  background: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  @media (max-width: 980px) {
    display: none;
  }
  .dropdown {
    max-height: 0;
    transition: all 0.7s;
    &.active {
      max-height: 450px;
      /* min-height: 100px; */
    }
  }
  a,
  .tab {
    font-weight: medium;
    margin: 0 auto;
    border-radius: 10px;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;

    &:hover {
      background: #46466215;
      color: #1f0a74;
      svg {
        color: #1f0a74;
      }
    }
    &.active {
      position: relative;
      background: #46466215;
      color: #1f0a74;

      span {
        svg {
          color: #1f0a74;
        }
      }
    }
  }
`;

export default DashboardSidebar;
