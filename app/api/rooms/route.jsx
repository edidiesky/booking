import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const rooms = await prisma.rooms.findMany({});

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error getting rooms:", error); // Log the error for debugging
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
