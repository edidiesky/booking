import prisma from "@/prisma";
import getCurrentUserSession from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";

export async function GET(request) {
  const currentUser = await getCurrentUserSession();

  // Check if the user exists
  if (!currentUser) {
    return NextResponse.json(
      { message: "User not authenticated" },
      { status: 401 }
    );
  }

  try {
    // find the user
    const user = await prisma.user.findUnique({
      where: { id: currentUser?.id },
      select: {
        favourites: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userRoomFavourites = user?.favourites || [];
    // get the rooms by using the in operator
    const rooms = await prisma.rooms.findMany({
      where: {
        id: { in: userRoomFavourites },
      },
    });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error updating favourites:", error); // Log the error for debugging
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
