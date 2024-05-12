"use client"
import React, { useState } from "react";
import { motion, AnimatePresence, Variant } from 'framer-motion'
import styled from "styled-components";
import { RxCross2 } from "react-icons/rx";
// import { useAppDispatch, useAppSelector } from "@/hooks/reduxtoolkit";
// import { ClearUserInfoAlert } from "@/features/auth/authSlice";
// import { AdminDeleteUserProfile } from "@/features/auth/authReducer";



export default function DeleteModal(
  { type, modal, setModal, id }) {
  // const dispatch = useAppDispatch();
  // const { userAlert, userDetails } = useAppSelector((store) => store.auth);
  const handleClearAlert = () => {
    setModal(false)
  }
  return (
    <DeleteContainer
      as={motion.div}
      initial={{ opacity: 0, visibility: "hidden" }}
      exit={{ opacity: 0, visibility: "hidden" }}
      animate={{ opacity: 1, visibility: "visible" }}>
      <motion.div
        initial={{
          opacity: 0,
          y: "100vh",
          visibility: "hidden"
        }}
        animate={{
          opacity: 1,
          y: "0",
          visibility: "visible",
          transition: { duration: .6, ease: [0.76, 0, .24, 1] }
        }}
        exit={{
          y: "100vh",
          transition: { duration: .6, ease: [0.76, 0, .24, 1] }
        }}
        className={"deleteCard"}>
        <div
          className="cross"
          onClick={handleClearAlert}
        >
          <RxCross2 />
        </div>
        <div className="deleteCardTop">
          <h3 className='text-3xl font-bold family1'>Delete User?</h3>
          <p className="family1 fs-18">
            Are you sure you want to delete user with id <span className="text-blue">&quot;{id}&quot; </span> from
            the database?
            <br /> You can&quot;t undo this action.
          </p>
        </div>

        <div className="deleteCardBottom">
          <button className="family1" onClick={handleClearAlert}>
            Cancel
          </button>
          <button
            className="deleteBtn family1"
            // onClick={() => dispatch(AdminDeleteUserProfile({ Detailsdata: id }))}
          >
            Delete User
          </button>
        </div>
      </motion.div>
    </DeleteContainer>
  );

}

const DeleteContainer = styled(motion.div)`
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  display: flex;
  z-index: 4900;
  align-items: center;
  justify-content: center;
  top: 0;
  background: rgba(0, 0, 0, 0.4);
  .deleteCard {
    max-width: 400px;
    min-width: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: #fff;
    padding: 4rem 3rem;
    gap: 2rem;
    border-radius: 6px;
    box-shadow: 0 2rem 3rem rgba(0, 0, 0, 0.4);
    position: relative;
    .cross {
      position: absolute;
      right: 10px;
      top: 20px;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      &:hover {
        background: var(--grey-2);
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
    .deleteCardCenter {
      padding: 2rem;
      width: 100%;
      background: var(--grey-3);
      border-left: 5px solid var(--red);
      display: flex;
      align-items: center;
      gap: 2rem;
      svg {
        font-size: 2rem;
        color: var(--red);
      }
      h4 {
        font-size: 1.6rem;
        font-weight: 400;
        color: var(--red);
        .deleteSpan {
          font-weight: 600;
          display: block;
          padding-bottom: 1rem;
        }
      }
    }

    .deleteCardTop {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 1.4rem;
      p {
        line-height: 1.4;
        font-size:1.3rem;
        text-align: center;
      }
    }
  }
`;
