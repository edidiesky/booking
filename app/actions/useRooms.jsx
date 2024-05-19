"use client";
import React, { useState, useEffect } from "react";
import prisma from "@/prisma";
import axios from "axios";

export default function useRooms() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const getRooms = async () => {
      try {
        const response = await axios.get("/api/rooms");
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
