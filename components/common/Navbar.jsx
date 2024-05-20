"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";
import Menu from "./Menu";
import { BiCart } from "react-icons/bi";
import { HiBars3 } from "react-icons/hi2";
import LoginModal from "../modals/Login";
import RegisterModal from "../modals/Register";
import { signOut } from "next-auth/react";
const Navbar = ({ currentUser }) => {
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState(false);
  const [loginmodal, setLoginModal] = useState(false);
  const [registermodal, setRegisterModal] = useState(false);

  const handleScroll = () => {
    window.scrollY > 150 ? setActive(true) : setActive(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // console.log(currentUser);
  return (
    <>
      <AnimatePresence mode="wait">
        {loginmodal && (
          <LoginModal
            registermodal={registermodal}
            modal={loginmodal}
            setModal={setLoginModal}
            setRegisterModal={setRegisterModal}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {registermodal && (
          <RegisterModal
            setLoginModal={setLoginModal}
            modal={registermodal}
            setModal={setRegisterModal}
          />
        )}
      </AnimatePresence>
      <div
        className={`${
          active ? "shadow-lg bg-white" : "bg-inherit"
        } w-full sticky min-h-[70px] top-0 z-[500] py-4`}
      >
        <Menu setMenu={setMenu} menu={menu} />
        <div className={`w-full mx-auto max-w-custom_2`}>
          <div className="w-[95%] mx-auto text-text_dark_1 flex item-center justify-space gap-2 lg:gap-4">
            <div className="flex-1 flex items-center gap-1 justify-start">
              <Image
                alt="Cotion"
                width={0}
                sizes="100vw"
                height={0}
                loading="lazy"
                src="https://www.hopper.com/assets/treasure-D-5S8iOp.svg"
                className="w-14 h-14 rounded-full object-cover"
              />
              <h4 className="hidden lg:flex flex-col text-xl font-bold font-booking_font_bold text-dark">
                HOME & VILLAS{" "}
                <span className="block font-bold text-xs font-booking_font">
                  {" "}
                  Benneth Okeke
                </span>
              </h4>
            </div>
            <div className="flex items-center justify-center gap-2 flex-1">
              <div className="flex lg:hidden items-center justify-start flex-1 span">
                <HiBars3 fontSize={"34px"} color="#000" />
              </div>
              <div className="flex-1 hidden lg:flex justify-center items-center gap-8">
                <Link
                  href={"/"}
                  className="font-booking_font_normal text-base"
                >
                  Home
                </Link>
                <Link
                  href={"/"}
                  className="font-booking_font_normal text-base"
                >
                  About
                </Link>

                <Link
                  href={"/"}
                  className="font-booking_font_normal text-base"
                >
                  Collections
                </Link>

                <Link
                  href={"/"}
                  className="font-booking_font_normal text-base"
                >
                  Service
                </Link>
              </div>
            </div>

            <ProfileDropdownStyles className="flex-1 relative flex items-end justify-end gap-4">
              {/* <div className="w-12 lg:w-12 h-12 lg:h-12 rounded-full bg-[#000] flex items-center justify-center text-2xl text-white">
                <BiCart />
              </div> */}
              <div className="flex profile_wrapper relative items-center gap-2">
                <div className="flex items-center gap-2">
                  {currentUser?.image ? (
                    <img
                      src={currentUser?.image}
                      alt=""
                      className="w-12 lg:w-12 h-12 lg:h-12 rounded-full"
                    />
                  ) : currentUser?.username ? (
                    <div className="w-12 h-12 text-white rounded-full bg-[#000] text-2xl flex items-center justify-center ">
                      {currentUser?.username[0]}{" "}
                    </div>
                  ) : (
                    <img
                      src="https://fundednext.fra1.digitaloceanspaces.com/dashboard/demo-avatar.jpg"
                      alt=""
                      className="w-12 lg:w-12 h-12 lg:h-12 rounded-full"
                    />
                  )}
                  {currentUser && (
                    <h4 className="text-base font-booking_font_bold text-dark font-bold family1">
                      {currentUser?.name}
                      <span className="block font-normal font-booking_font text-sm text-grey">
                        {currentUser?.email}
                      </span>
                    </h4>
                  )}
                </div>
                <div className="profile_dropdown shadow-2xl absolute">
                  <div className="w-full flex flex-col">
                    {currentUser?.role === "admin" ? (
                      <div className="flex profile_dropdown_bottom flex-col w-full">
                        <Link
                          href={"/dashboard"}
                          className="font-booking_font_bold text-xl p-2 family1 w-full profile_list text-dark block"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href={"/dashboard/settings"}
                          className="font-booking_font_bold text-xl p-2 family1 w-full profile_list text-dark block"
                        >
                          Profile
                        </Link>
                        <div
                          onClick={() => signOut()}
                          className="font-booking_font_bold text-xl p-2 family1 w-full profile_list text-dark block"
                        >
                          Log Out
                        </div>
                      </div>
                    ) : currentUser?.email ? (
                      <div className="flex profile_dropdown_bottom flex-col w-full">
                        <Link
                          href={"/Reservation"}
                          className="font-booking_font_bold text-xl p-2 family1 w-full profile_list text-dark block"
                        >
                          Reservation
                        </Link>
                        <Link
                          href={"/Favourites"}
                          className="font-booking_font_bold text-xl p-2 family1 w-full profile_list text-dark block"
                        >
                          Favourites
                        </Link>
                        <Link
                          href={"/dashboard/settings"}
                          className="font-booking_font_bold text-xl p-2 family1 w-full profile_list text-dark block"
                        >
                          Profile
                        </Link>
                        <div
                          onClick={() => signOut()}
                          className="font-booking_font_bold text-xl p-2 family1 w-full profile_list text-dark block"
                        >
                          Log Out
                        </div>
                      </div>
                    ) : (
                      <div className="flex profile_dropdown_bottom flex-col w-full">
                        <div
                          onClick={() => setRegisterModal(true)}
                          className="font-booking_font_bold text-xl p-2 family1 w-full profile_list text-dark block"
                        >
                          Sign Up
                        </div>
                        <div
                          onClick={() => setLoginModal(true)}
                          className="font-booking_font_bold text-xl p-2 family1 w-full profile_list text-dark block"
                        >
                          Sign In
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ProfileDropdownStyles>
          </div>
        </div>
      </div>
    </>
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
