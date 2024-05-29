"use client";
import React, { useState } from "react";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { motion, AnimatePresence, Variant } from "framer-motion";
import styled from "styled-components";
import { RxCross2 } from "react-icons/rx";
import { BiMinus, BiPlus } from "react-icons/bi";
import { RegisterFormInputData } from "@/constants/data/formdata";
import toast from "react-hot-toast";
import Loader from "../loader";
import { signIn } from "next-auth/react";
import { useAppDispatch } from "@/app/hooks/useCustomRedux";
import {
  offLoginModal,
  onLoginModal,
  offRegisterModal,
  onRegisterModal,
} from "@/app/libs/features/modals/modalSlice";


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
const RegisterModal = ({ modal}) => {
  const dispatch = useAppDispatch()
  const handleClearAlert = () => {
   dispatch(offRegisterModal())
  };
  const [formvalue, setFormValue] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleFormChange = (e) => {
    setFormValue({
      ...formvalue,
      [e.target.name]: e.target.value,
    });
  };
  const handleLoginModal = () => {
    dispatch(offRegisterModal());
    dispatch(onLoginModal());
  };

  const handleFormSubmision = (e) => {
    e.preventDefault();
    setLoading(true);
    axios
      .post("/api/register", formvalue)
      .then(() => {
          dispatch(offRegisterModal());
      })
      .catch((error) => {
        // toast.error(error);
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  return (
    <RegisterModalStyles
      as={motion.div}
      initial={{ opacity: 0, visibility: "hidden" }}
      exit={{ opacity: 0, visibility: "hidden" }}
      animate={{ opacity: 1, visibility: "visible" }}
    >
      {
        loading && <Loader/>
      }
      <motion.div
        variants={ModalVariants}
        initial="initial"
        animate={modal ? "enter" : "exit"}
        exit="exit"
        className="guestModalCard"
      >
        <div className="w-full mx-auto h-[550px] flex flex-col">
          <div className="w-full sticky top-0 left-0 p-6 px-8 border-b flex border-[rgba(0,0,0,.2)] items-center justify-between">
            <h3 className="text-2xl font-bold font-booking_font_bold">
              Sign Up
              <span className="block text-sm font-light font-booking_font_normal">
                Register to your account and check out your bookings
              </span>
            </h3>
            <div className="cross" onClick={handleClearAlert}>
              <RxCross2 />
            </div>
          </div>
          <div className="w-full overflow-auto h-[400px] pb-6 flex">
            <form
              onSubmit={handleFormSubmision}
              className="w-[90%] mx-auto p-4 px-8 pb-4 flex flex-col gap-4"
            >
              {RegisterFormInputData?.map((input, index) => {
                return (
                  <label
                    key={index}
                    htmlFor={input.label}
                    className="text-sm font-booking_font_normal rounded-[10px] flex flex-col gap-2 text-dark"
                  >
                    <span className="text-dark font-bold">{input.label}</span>
                    <div className="input flex item-center gap-1">
                      {/* <MdOutlineMailOutline fontSize={'18px'} className="text-grey" /> */}
                      <input
                        className="w-full rounded-2xl text-dark font-normal text-sm"
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
              <div className="w-full flex items-center justify-center flex-col gap-3">
                <button
                  type="submit"
                  className="p-4 px-8 text-center w-full cursor-pointer btn bg-[#000] rounded-[10px] font-booking_font_normal font-bold text-white"
                >
                  Sign Up
                </button>
                <div className="w-full flex items-center justify-start gap-2">
                  <span className="text-sm font-light text-dark">
                    Already a Member?{" "}
                    <span
                      onClick={handleLoginModal}
                      style={{ textDecoration: "underline" }}
                      className="font-bold font-booking_font_bold cursor-pointer"
                      // href={"#"}
                    >
                      Sign In
                    </span>
                  </span>
                </div>
              </div>
              <div className="option text-dark">or</div>
              <div onClick={() => signIn('google')} className="p-4 px-8 items-center flex justify-center gap-4 w-full cursor-pointer btn text-[#fff] rounded-[10px] font-booking_font_normal font-bold border border-[rgba(0,0,0,.9)]">
                <FcGoogle fontSize={"28px"} />
                Continue with Google
              </div>
              {/* <div className="p-4 px-8 items-center flex justify-center gap-4 w-full cursor-pointer btn text-[#000] rounded-[10px] font-booking_font_normal font-bold border border-[rgba(0,0,0,.9)]">
                <FaGithub fontSize={"28px"} />
                Continue with Github
              </div>{" "} */}
            </form>
          </div>
        </div>
      </motion.div>
    </RegisterModalStyles>
  );
};
const RegisterModalStyles = styled(motion.div)`
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
  .option {
    width: 100%;
    position: relative;
    text-align: center;
    padding: 0 1.4rem;
    font-size: 15px;
    &::after {
      width: 45%;
      height: 0.2px;
      content: "";
      background-color: rgba(0, 0, 0, 0.1);
      left: 0;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
    }
    &::before {
      width: 45%;
      height: 0.4px;
      content: "";
      background-color: rgba(0, 0, 0, 0.1);
      right: 0;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
    }
  }
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

export default RegisterModal;
