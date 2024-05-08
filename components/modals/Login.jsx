"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variant } from "framer-motion";
import styled from "styled-components";
import { RxCross2 } from "react-icons/rx";
import { BiMinus, BiPlus } from "react-icons/bi";
import { LoginFormInputData } from "@/constants/data/formdata";
const ModalVariants = {
  initial: {
    opacity: 0,
    y: "100vh",
  },
  enter: {
    opacity: 1,
    y: "0",
    transition: { duration: 1, ease: [0.76, 0, 0.24, 1] },
  },
  exit: {
    opacity: 1,
    y: "100vh",

    transition: { duration: 1, ease: [0.76, 0, 0.24, 1] },
  },
};
const LoginModal = ({ modal, setModal }) => {
  const handleClearAlert = () => {
    setModal(false);
  };
  const [formvalue, setFormValue] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    country: "",
    location: "",
    state: "",
    zipcode: "",
    address: "",
  });

  const handleFormChange = (e) => {
    setFormValue({
      ...formvalue,
      [e.target.name]: e.target.value,
    });
  };
  return (
    <LoginModalStyles
      as={motion.div}
      initial={{ opacity: 0, visibility: "hidden" }}
      exit={{ opacity: 0, visibility: "hidden" }}
      animate={{ opacity: 1, visibility: "visible" }}
    >
      <motion.div
        variants={ModalVariants}
        initial="initial"
        animate={modal ? "enter" : "exit"}
        exit="exit"
        className="guestModalCard"
      >
        <div className="w-full mx-auto flex py-4 flex-col gap-8">
          <div className="w-full flex flex-col">
            <div className="w-full p-6 px-8 border-b flex border-[rgba(0,0,0,.2)] items-center justify-between">
              <h3 className="text-2xl font-bold font-booking_font4">
                Sign In
                <span className="block text-sm font-light">
                  Login to your account and check out your bookings
                </span>
              </h3>
              <div className="cross" onClick={handleClearAlert}>
                <RxCross2 />
              </div>
            </div>
          </div>

          <form className="w-[90%] mx-auto p-4 px-8 pb-4 flex flex-col gap-8">
            {LoginFormInputData?.map((input, index) => {
              return (
                <label
                  key={index}
                  htmlFor={input.label}
                  className="text-sm font-booking_font4 rounded-[10px] flex flex-col gap-2 text-dark"
                >
                  <span className="text-dark font-bold">{input.label}</span>
                  <div className="input flex item-center gap-1">
                    {/* <MdOutlineMailOutline fontSize={'18px'} className="text-grey" /> */}
                    <input
                      className="w-100 rounded-2xl font-normal text-base"
                      required={true}
                      name={input?.name}
                      id={input.label}
                      value={formvalue[input.name]}
                      type={input.type}
                      placeholder={input.label}
                      onChange={handleFormChange}
                    ></input>
                  </div>
                </label>
              );
            })}
            <div className="p-4 px-8 text-center w-full cursor-pointer btn rounded-[10px] font-booking_font4 font-bold text-white">
              Sign In
            </div>
          </form>
        </div>
      </motion.div>
    </LoginModalStyles>
  );
};
const LoginModalStyles = styled(motion.div)`
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  display: flex;
  z-index: 4900;
  align-items: center;
  justify-content: center;
  top: 0;
  background: rgba(0, 0, 0, 0.3);
  .guestModalCard {
    max-width: 400px;
    min-width: 540px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: #fff;
    gap: 2rem;
    border-radius: 6px;
    box-shadow: 0 2rem 3rem rgba(0, 0, 0, 0.4);
    position: relative;
    .cross {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      &:hover {
        background: #d9d8d8;
      }
      svg {
        font-size: 20px;
      }
    }
    .deleteCardBottom {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: 2rem;
      gap: 1rem;
      button {
        padding: 1.2rem 2rem;
        border: none;
        font-size: 1.3rem;
        font-weight: 400;
        background: var(--grey-2);
        color: #fff;
        outline: none;
        border-radius: 40px;
        cursor: pointer;
        text-transform: none;
        &:hover {
          background: var(--grey-1);
          color: var(--text-color);
        }
        &.deleteBtn {
          background: var(--blue-1);
          &:hover {
            opacity: 0.8;
            color: #fff;
          }
        }
      }
    }
  }
`;

export default LoginModal;
