"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";

export default function useGetUserFavourites({
  currentUser,
  setLoginModal,
  loginmodal,
  roomid,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rooms, setRooms] = useState([]);
  //   console.log(roomid);
  //   useEffect(() => {
  //     const getRooms = async () => {
  //       try {
  //         const response = await axios.get(`/api/reservation/user`);
  //         setRooms(response.data);
  //       } catch (err) {
  //         setError(err);
  //       } finally {
  //         setLoading(false);
  //       }
  //     };
  //     getRooms();
  //   }, [setLoading, setRooms, setError]);

  const hasFavourited = useMemo(() => {
    const room = currentUser?.favourites || [];
    return room?.includes(roomid);
  }, [currentUser, roomid]);

  return { hasFavourited };
}
