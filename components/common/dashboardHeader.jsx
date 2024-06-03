"use client";
import styled from "styled-components";
import { RxCross1 } from "react-icons/rx";
import { FaBars } from "react-icons/fa6";
import { FaRegUser, FaHotel } from "react-icons/fa";
import { TiHome, TiMessage } from "react-icons/ti";
import { usePathname } from "next/navigation";
import { RxTimer } from "react-icons/rx";
import { LuBedDouble } from "react-icons/lu";
import { BiSearch } from "react-icons/bi";
import Link from "next/link";
import React, { useState } from "react";
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

const DashboardHeader = ({ sidebar, setSidebar, currentUser }) => {
  // const dispatch = useAppDispatch()
  const pathname = usePathname();
  const [bar, setBar] = React.useState(false);
  const [activeindex, setActiveIndex] = useState(0);

  const handleLogOut = () => {
    // dispatch(ClearUserInfo("any"));
    window.location.reload();
  };
  return (
    <HeaderStyles className="w-full z-[3000] bg-white border-b flex relative items-center justify-center">
      <div className="Header_wrapper w-[95%] mx-auto flex items-center justify-between">
        <div className="flex w-full items-center gap-3">
          <div
            onClick={() => setBar(!bar)}
            className="flex flex-1 lg:hidden gap-4 items-center justify-start text-dark"
          >
            {bar ? (
              <RxCross1 fontSize={"30px"} />
            ) : (
              <FaBars fontSize={"30px"} />
            )}
          </div>

          <label
            htmlFor=""
            className="hidden md:flex text-lg text-dark w-[200px] lg:w-[250px]
             items-center gap-2 h-12 border rounded-[10px] bg-[#f9f9f9] px-4"
          >
            <div className=" text-dark flex items-center justify-center">
              <BiSearch />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent border-none outline-none text-sm text-dark flex-1"
            />
          </label>
        </div>
        <div className="flex w-full auto items-center justify-end gap-1">
          <div className="flex profile_wrapper relative items-center gap-2">
            <div className="flex items-center gap-2">
              <img
                src="https://fundednext.fra1.digitaloceanspaces.com/dashboard/demo-avatar.jpg"
                alt=""
                className="w-10 rounded-full"
              />
              <h4 className="text-base text-dark font-booking_font_bold font-bold family1">
                {currentUser?.name}
                <span className="block font-normal font-booking_font text-xs text-dark">
                  {currentUser?.email}
                </span>
              </h4>
            </div>
            <div className="profile_dropdown shadow-2xl absolute">
              <div className="w-full flex flex-col">
                <div className="flex profile_dropdown_bottom flex-col w-full">
                  <Link
                    href={"/dashboard"}
                    className="font-bold font-booking_font_bold text-xl p-2 family1 w-full profile_list text-dark block"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={"/dashboard/settings"}
                    className="font-bold font-booking_font_bold text-xl p-2 family1 w-full profile_list text-dark block"
                  >
                    Profile
                  </Link>
                  <div
                    onClick={handleLogOut}
                    className="font-bold font-booking_font_bold text-xl p-2 family1 w-full profile_list text-dark block"
                  >
                    Log Out
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{ zIndex: "200" }}
        className={`${
          bar ? "left-0" : "-left-[100%]"
        } w-[300px] bg-white border-r shadow-2xl  h-full transition-all ease duration-700 fixed flex lg:hidden top-0 flex-col gap-2`}
      >
        <div
          onClick={() => setBar(!bar)}
          style={{ zIndex: "200" }}
          className={`${
            bar ? "left-0" : "-left-[100%]"
          } w-full h-full transition-all ease duration-300 fixed flex lg:hidden top-0 bg-[#42424227] flex-col gap-2`}
        ></div>
        {/* <div className="w-full h-full absolute bg-[#fff] z-[24] object-cover" /> */}
        <div
          style={{ zIndex: "200" }}
          className="w-full h-full bg-white Header_wrapper py-4 flex items-start flex-col gap-4"
        >
          <div className="flex px-3 items-center gap-2">
            <img
              src="https://fundednext.fra1.digitaloceanspaces.com/dashboard/demo-avatar.jpg"
              alt=""
              className="w-10 rounded-full"
            />
            <h4 className="text-base font-booking_font4 text-dark">
              {currentUser?.fullname || "Jermiah frim"}
              <span className="block font-normal font-booking_font text-sm text-dark">
                {currentUser?.email || "jerrme@gmail.com"}
              </span>
            </h4>
          </div>
          <div className="w-full my-4 flex flex-col">
            {AdminSidebarData?.map((x, index) => {
              return (
                <div key={index} className="w-[90%] mx-auto">
                  <Link
                    className={`
                      ${pathname === `/dashboard${x.tab.path}` ? "active" : ""}
                      text-3xl w-[90%] mx-auto text-dark font-medium`}
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
      </div>
    </HeaderStyles>
  );
};

export const HeaderStyles = styled.div`
  padding: 0.5rem 0;
  min-height: 4.8rem;
  width: 100%;
  position: sticky;
  top: 0;
  left: 0;
  background:#fff;
  .profile_wrapper:hover .profile_dropdown {
    opacity: 1;
    transform: scale(1);
    visibility: visible;
  }
  .profile_dropdown {
    width: 150px;
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.3s;
    overflow: hidden;
    visibility: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.08);
    z-index: 220;
    background: #fff;
    top: 100%;
    right: 0%;
    border-radius: 10px;
    .profile_card {
      padding: 1.3rem 1.5rem;

      cursor: pointer;
    }
  }
  .profile_list {
    padding: 10px 2rem;
    font-size: 14px;
    transition: all 0.3s;
    cursor: pointer;

    &:nth-last-child() {
      border-bottom: none;
    }
  }
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
    padding: 6px 14px;
    font-weight: normal;
    margin: 0 auto;
    font-size: 14px;
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
      background: #635bff;
      color: #fff;

      svg {
        color: #fff;
      }
    }
    &.active {
      position: relative;
      background: #635bff;
      color: #fff;
      svg {
        color: #fff;
      }
      span {
        svg {
          color: #fff;
        }
      }
    }
  }
`;

export default DashboardHeader;
