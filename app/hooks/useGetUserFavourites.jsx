"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAppDispatch } from "./useCustomRedux";
import { onLoginModal } from "../libs/features/modals/modalSlice";

export default function useGetUserFavourites({
  currentUser,
  setLoginModal,
  loginmodal,
  roomid,
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rooms, setRooms] = useState([]);

  const handleFavouriteRooms = useCallback(async () => {
    if (!currentUser) {
      dispatch(onLoginModal());
    } else {
      try {
        const { data } = await axios.post(
          `/api/favourites/${roomid}`,
          apartment
        );
        // console.log(data);
        const { favourite, message } = data;
        toast.success(message);
        router.refresh();
        // return favourite;
      } catch (error) {
        toast.error(error?.response?.data?.message);
      } finally {
      }
    }
  }, [currentUser, router, roomid]);

  return {
    handleFavouriteRooms,
  };
}
