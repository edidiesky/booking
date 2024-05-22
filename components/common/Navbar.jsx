"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AiOutlineBars } from "react-icons/ai";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";
import LoginModal from "../modals/Login";
import RegisterModal from "../modals/Register";
import { signOut } from "next-auth/react";
const Navbar = ({ currentUser }) => {
  const [bar, setBar] = React.useState(false);
  const [active, setActive] = useState(false);
  const [loginmodal, setLoginModal] = useState(false);
  const [registermodal, setRegisterModal] = useState(false);

  const linkData = [
    {
      title: "Collections",
      path: "collections",
    },
    {
      title: "Saved Homes",
      path: "savedhomes",
    },
    {
      title: "Destinations",
      path: "destinations",
    },
    {
      title: "My Trips",
      path: "trips",
    },
    {
      title: "About & FAQ",
      path: "about",
    },
  ];
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
      <div className={`bg-inherit w-full min-h-[80px] z-[500] py-4`}>
        <div className={`w-full mx-auto max-w-custom_2`}>
          <div className="w-[95%] mx-auto text-text_dark_1 flex items-center justify-between gap-2 lg:gap-4">
            <div className=" flex items-center gap-1 justify-start">
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
            <div
              className="flex-1 hidden lg:flex justify-center items-center 
            gap-8"
            >
              {linkData?.map((link, index) => {
                return (
                  <Link
                    style={{ transition: "all .4s" }}
                    key={index}
                    href={`/${link?.path}`}
                    className="font-booking_font_normal hover:text-[#706f6f] text-base"
                  >
                    {link?.title}
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-4">
              <div className="flex lg:hidden backdrop:span">
                <AiOutlineBars
                  onClick={() => setBar(true)}
                  fontSize={"25px"}
                  color="#000"
                />
              </div>
              <ProfileDropdownStyles className=" relative flex items-end justify-end gap-4">
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
                      // <div className="w-12 h-12 text-white rounded-full bg-[#000] text-2xl flex items-center justify-center ">
                      //   {currentUser?.username[0]}{" "}
                      // </div>
                      <img
                        src="https://fundednext.fra1.digitaloceanspaces.com/dashboard/demo-avatar.jpg"
                        alt=""
                        className="w-12 lg:w-12 h-12 lg:h-12 rounded-full"
                      />
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
                          <Link
                            href={"/trips"}
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
                            href={"/trips"}
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
      </div>
      <div
        style={{ zIndex: "200" }}
        className={`${
          bar ? "left-0" : "-left-[100%]"
        } w-[300px] h-full transition-all ease duration-700 fixed flex lg:hidden top-0 bg-[#fff] shadow-2xl column gap-2`}
      >
        <div
          onClick={() => setBar(!bar)}
          style={{ zIndex: "200" }}
          className={`${
            bar ? "left-0" : "-left-[100%]"
          } w-full h-full transition-all ease duration-300 fixed flex lg:hidden top-0 bg-[#42424227] column gap-2`}
        ></div>

        <div
          style={{ zIndex: "200" }}
          className="w-full Header_wrapper h-full bg-white flex item-center flex-col gap-4"
        >
          <div className="flex p-4 items-center gap-2">
            {currentUser?.image ? (
              <img
                src={currentUser?.image}
                alt=""
                className="w-12 lg:w-12 h-12 lg:h-12 rounded-full"
              />
            ) : currentUser?.username ? (
              // <div className="w-12 h-12 text-white rounded-full bg-[#000] text-2xl flex items-center justify-center ">
              //   {currentUser?.username[0]}{" "}
              // </div>
              <img
                src="https://fundednext.fra1.digitaloceanspaces.com/dashboard/demo-avatar.jpg"
                alt=""
                className="w-12 lg:w-12 h-12 lg:h-12 rounded-full"
              />
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
          <ul className="flex flex-col w-full">
            {currentUser
              ? linkData?.slice(0, 6)?.map((x, index) => {
                  return (
                    <Link
                      href={`/${x.path}`}
                      key={index}
                      className="font-normal text-dark font-booking_font
                        hover:bg-[rgba(0,0,0,.1)] py-[20px] border-b text-lg px-8"
                    >
                      {x.title}
                    </Link>
                  );
                })
              : linkData?.map((x, index) => {
                  return (
                    <Link
                      href={`/${x.path}`}
                      key={index}
                      className="font-bold text-dark font-booking_font_bold  hover:bg-[rgba(0,0,0,.1)] py-[20px] border-b text-lg px-8"
                    >
                      {x.title}
                    </Link>
                  );
                })}
            {!currentUser && (
              <div className="w-100 px-2 py-2 flex items-center gap-4">
                <Link href={"/register"} className="btn w-full btn-1 text-xl ">
                  Sign Up
                </Link>
                <div className="btn_wrapper w-full">
                  <div className="btn w-full btn-2 text-xl font-bold">
                    Log In
                  </div>
                </div>
              </div>
            )}
          </ul>
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
