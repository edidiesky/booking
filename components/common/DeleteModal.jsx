"use client";
import React, { useState } from "react";
import { motion, AnimatePresence, Variant } from "framer-motion";
import styled from "styled-components";
import { RxCross2 } from "react-icons/rx";
// import { useAppDispatch, useAppSelector } from "@/hooks/reduxtoolkit";
// import { ClearUserInfoAlert } from "@/features/auth/authSlice";
// import { AdminDeleteUserProfile } from "@/features/auth/authReducer";

export default function DeleteModal({ type, modal, setModal, id }) {
  // const dispatch = useAppDispatch();
  // const { userAlert, userDetails } = useAppSelector((store) => store.auth);
  const handleClearAlert = () => {
    setModal(false);
  };
  return (
    <DeleteContainer
      as={motion.div}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{
          y: "100vh",
        }}
        animate={{
          y: "0",
          transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] },
        }}
        exit={{
          y: "100vh",
          transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] },
        }}
        className={"deleteCard gap-2"}
      >
        <div className="cross" onClick={handleClearAlert}>
          <RxCross2 />
        </div>
        <div className="deleteCardTop">
          <h3 className="text-xl font-bold family1">Delete this User?</h3>
          <p className="family1 text-base text-center leading-[1.2]">
            Are you sure you want to delete user with id{" "}
            <span className="text-blue">&quot;{id}&quot; </span> from the
            database?
            <br /> You can&quot;t undo this action.
          </p>
        </div>

        <div className="deleteCardBottom">
          <button
            className="family1 flex items-center justify-center text-base"
            onClick={handleClearAlert}
          >
            Cancel
          </button>
          <button
            className="btn deleteBtn family1 flex items-center justify-center text-base"
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
    padding: 2rem;
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
        background: #eee;
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
        height: 60px;
        border: none;
        font-weight: 400;
        background: #eee;
        color: #000;
        outline: none;
        border-radius: 40px;
        cursor: pointer;
        text-transform: none;
        &:hover {
          background: #c4c4c4;
        }
        &.deleteBtn {
          background: #000;
          color: #fff;
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
      svg {
        font-size: 2rem;
        color: var(--red);
      }
    }

    .deleteCardTop {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 1.4rem;
    }
  }
`;
