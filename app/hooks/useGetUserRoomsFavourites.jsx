"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function useGetUserRoomsFavourites() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);

  useEffect(async () => {
    try {
      const { data } = await axios(`/api/favourites`);

      setRooms(data);
      // return favourite;
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setRooms]);

  return {
    loading,
    rooms,
  };
}
