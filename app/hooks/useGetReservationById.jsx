"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function useGetReservationById() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rooms, setRooms] = useState([]);
  //   console.log(roomid);
  useEffect(() => {
    const getRooms = async () => {
      try {
        const response = await axios.get(`/api/reservation/user`);
        setRooms(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    getRooms();
  }, [setLoading, setRooms, setError]);

  return { loading, error, rooms };
}
