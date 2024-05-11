"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";
import Menu from "./Menu";
import { BiCart } from "react-icons/bi";
import { HiBars3 } from "react-icons/hi2";
const Navbar = ({ text, path }) => {
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState(false);
  const handleScroll = () => {
    window.scrollY > 150 ? setActive(true) : setActive(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div
      className={`${
        active ? "shadow-lg bg-white" : "bg-inherit"
      } w-full sticky min-h-[70px] top-0 z-[500] py-4`}
    >
      <Menu setMenu={setMenu} menu={menu} />
      <div className={`w-full mx-auto max-w-custom_2`}>
        <div className="w-[95%] mx-auto text-text_dark_1 flex item-center justify-space gap-2 md:gap-4">
          <div className="flex md:hidden items-center justify-start flex-1 span">
            <HiBars3 fontSize={"34px"} color="#000" />
          </div>
          <div className="flex-1 hidden md:flex items-center gap-8">
            <Link href={"/"} className="font-booking_font2 font-bold text-lg">
              Home
            </Link>
            <Link href={"/"} className="font-booking_font2 font-bold text-lg">
              About
            </Link>

            <Link href={"/"} className="font-booking_font2 font-bold text-lg">
              Collections
            </Link>

            <Link href={"/"} className="font-booking_font2 font-bold text-lg">
              Service
            </Link>
          </div>
          <div className="flex-1 flex items-center gap-1 justify-center">
            <Image
              alt="Cotion"
              width={0}
              sizes="100vw"
              height={0}
              loading="lazy"
              src="https://www.hopper.com/assets/treasure-D-5S8iOp.svg"
              className="w-14 h-14 rounded-full object-cover"
            />
            <h4 className="hidden md:flex flex-col text-xl font-bold text-dark">
              HOME & VILLAS{" "}
              <span className="block font-bold text-xs font-booking_font1">
                {" "}
                Benneth Okeke
              </span>
            </h4>
          </div>
          <ProfileDropdownStyles className="flex-1 relative flex items-end justify-end gap-4">
            <div className="w-12 md:w-12 h-12 md:h-12 rounded-full bg-[#000] flex items-center justify-center text-2xl text-white">
              <BiCart />
            </div>
            <div className="flex profile_wrapper relative items-center gap-2">
              <div className="flex items-center gap-2">
                <img
                  src="https://fundednext.fra1.digitaloceanspaces.com/dashboard/demo-avatar.jpg"
                  alt=""
                  className="w-12 md:w-12 h-12 md:h-12 rounded-full"
                />
                {/* <h4 className="text-base text-dark font-bold family1">
                  {userInfo?.fullname || "Jermiah frim"}
                  <span className="block font-normal text-sm text-dark">
                    {userInfo?.email || "jerrme@gmail.com"}
                  </span>
                </h4> */}
              </div>
              <div className="profile_dropdown shadow-2xl absolute">
                <div className="w-full flex flex-col">
                  <div className="flex profile_dropdown_bottom flex-col w-full">
                    <Link
                      href={"/dashboard"}
                      className="font-medium text-xl p-2 family1 w-full profile_list text-dark block"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={"/dashboard/settings"}
                      className="font-medium text-xl p-2 family1 w-full profile_list text-dark block"
                    >
                      Profile
                    </Link>
                    <div
                      // onClick={handleLogOut}
                      className="font-medium text-xl p-2 family1 w-full profile_list text-dark block"
                    >
                      Log Out
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ProfileDropdownStyles>
        </div>
      </div>
    </div>
  );
};
export const ProfileDropdownStyles = styled.div`
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
    &:hover {
      background: #eee;
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

`;
export default Navbar;
