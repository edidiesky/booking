"use client";
import React, { useState, useEffect } from "react";
import prisma from "@/prisma";
import axios from "axios";

export default function useGetRoomById({roomid}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [room, setRoom] = useState({});
//   console.log(roomid);
    useEffect(() => {
      const getRooms = async () => {
        try {
          const response = await axios.get(`/api/rooms/${roomid}`);
          setRoom(response.data);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      };
      getRooms();
    }, [setLoading, setRoom, setError]);

  return { loading, error, room };
}
