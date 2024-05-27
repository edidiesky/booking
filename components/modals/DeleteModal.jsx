"use client";
import React, { useState } from "react";
import axios from "axios";
import { CiWarning } from "react-icons/ci";
import { motion, AnimatePresence, Variant } from "framer-motion";
import styled from "styled-components";
import { RxCross2 } from "react-icons/rx";
import toast from "react-hot-toast";
import Loader from "../loader";
import { useRouter } from "next/navigation";
export default function DeleteModal({ type, modal, setModal, room }) {
  const [roomdeleteloading, setRoomDeleteLoading] = useState(false);
  const router = useRouter();
  const handleClearAlert = () => {
    setModal(false);
  };
  const handleDeleteRoom = async () => {
    try {
      setRoomDeleteLoading(true);
      await axios.delete(`/api/rooms/${room?.id}`);
      toast.success("Room has been succesfully deleted");

      router.refresh();
      setModal(false);
    } catch (error) {
      const erroMessage = error?.response?.data?.message || "An error occurred";
      toast.error(erroMessage);
    } finally {
      setRoomDeleteLoading(false);
      router.refresh();
    }
  };
  if (type === "rooms") {
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
          <div className="deleteCardTop p-8 px-4 flex items-center justify-center flex-col gap-2">
            <span className="w-full flex items-center justify-center">
              <CiWarning fontSize={"60px"} color={"var(--red)"} />
            </span>
            <h3 className="text-lg text-center font-bold font-booking_font_bold family1">
              Delete this room?
              <span className="block text-sm w-[80%] mx-auto text-center font-booking_font font-normal text-dark">
                By deleting this product, you are directly removing the product
                form the database and the website. It cannot be retrieved back
                if this action you carry has been taken.
              </span>
            </h3>
          </div>

          <div className="deleteCardBottom py-3 w-full flex items-center justify-end px-4 border-t">
            <button
              className="family1 font-booking_font_bold flex items-center justify-center text-sm"
              onClick={handleClearAlert}
            >
              Cancel
            </button>
            <button
              disabled={roomdeleteloading}
              onClick={handleDeleteRoom}
              className="deleteBtn family1 font-booking_font_bold flex items-center justify-center text-sm"
              // onClick={() => dispatch(AdminDeleteUserProfile({ Detailsdata: id }))}
            >
              {roomdeleteloading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader type="dots" />
                  Deleting in process
                </span>
              ) : (
                " Delete Room"
              )}
            </button>
          </div>
        </motion.div>
      </DeleteContainer>
    );
  }
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
        <div className="deleteCardTop p-8 px-4 flex items-center justify-center flex-col gap-2">
          <span className="w-full flex items-center justify-center">
            <CiWarning fontSize={"60px"} color={"var(--red)"} />
          </span>
          <h3 className="text-lg text-center font-bold font-booking_font_bold family1">
            Delete this user?
            <span className="block text-sm w-[80%] mx-auto text-center font-booking_font font-normal text-dark">
              By deleting this user, you are directly removing the product form
              the database and the website. It cannot be retrieved back if this
              action you carry has been taken.
            </span>
          </h3>
        </div>

        <div className="deleteCardBottom py-3 w-full flex items-center justify-end px-4 border-t">
          <button
            className="family1 font-booking_font_bold flex items-center justify-center text-sm"
            onClick={handleClearAlert}
          >
            Cancel
          </button>
          <button
            disabled={roomdeleteloading}
            onClick={handleDeleteRoom}
            className="deleteBtn family1 font-booking_font_bold flex items-center justify-center text-sm"
            // onClick={() => dispatch(AdminDeleteUserProfile({ Detailsdata: id }))}
          >
            {roomdeleteloading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader type="dots" />
                Deleting in process
              </span>
            ) : (
              " Delete user"
            )}
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
    max-width: 600px;
    min-width: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2rem 3rem rgba(0, 0, 0, 0.4);
    position: relative;
    @media (max-width: 780px) {
      max-width: 90%;
      min-width: 90%;
    }
    .cross {
      position: absolute;
      right: 10px;
      top: 1.5%;
      width: 2rem;
      height: 2rem;
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
      gap: 1rem;
      button {
        padding: 0.5rem 2rem;
        min-height: 46px;
        border: none;
        font-weight: 600;
        background: #eee;
        color: #000;
        outline: none;
        border-radius: 10px;
        cursor: pointer;
        text-transform: none;
        &:hover {
          background: #c4c4c4;
        }
        &.deleteBtn {
          background: var(--red);
          color: #fff;
          &:hover {
            opacity: 0.8;
            color: #fff;
          }
        }
      }
    }
    .deleteCardCenter {
      padding: 2rem 0;
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
    }
  }
`;
