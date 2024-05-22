import getCurrentUserSession from "@/app/actions/getCurrentUser";
import prisma from "@/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
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
        userid: currentUser?.id,
      },
      include: {
        user: true,
        rooms: true,
      },
      orderBy: {
        createdAt: "asc",
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
