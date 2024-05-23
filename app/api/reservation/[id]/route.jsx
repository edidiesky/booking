


import getCurrentUserSession from "@/app/actions/getCurrentUser";
import prisma from "@/prisma";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { message: "Room Id is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { startDate, endDate, totalPrice } = body;

    const currentUser = await getCurrentUserSession();
    if (!currentUser) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    // Check for room availability
    const availableRooms = await prisma.reservations.findMany({
      where: {
        roomid: id,
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
        ],
      },
    });

    if (availableRooms.length > 0) {
      return NextResponse.json(
        { message: "Room has already been booked" },
        { status: 400 }
      );
    }

    // Book the room
    const reservationData = {
      startDate,
      endDate,
      totalPrice,
      userid: currentUser.id,
      roomid: id,
    };

    const newReservation = await prisma.reservations.create({
      data: reservationData,
    });

    return NextResponse.json(newReservation, { status: 200 });
  } catch (error) {
    console.error("Error processing reservation request:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}


export async function GET(request, { params }) {
   const { id } = params;
   if (!id) {
     return NextResponse.json(
       { message: "Room Id is required" },
       { status: 400 }
     );
   }

  try {
    const currentUser = await getCurrentUserSession();
    if (!currentUser) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    // Check for room availability
    const availableRooms = await prisma.reservations.findUnique({
      where: {
        id:id,
        userid: currentUser?.id,
      },
      include: {
        user: true,
        rooms: true,
      },
    });

    return NextResponse.json(availableRooms, { status: 200 });
  } catch (error) {
    console.error("Error processing reservation request:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
