

import prisma from "@/prisma";
import getCurrentUserSession from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { id } = params;
  const currentUser = await getCurrentUserSession();

  // Check if the user exists
  if (!currentUser) {
    return NextResponse.json(
      { message: "User not authenticated" },
      { status: 401 }
    );
  }

  if (!id) {
    return NextResponse.json(
      { message: "Room ID is required" },
      { status: 400 }
    );
  }

  try {
    const room = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!room) {
      return NextResponse.json({ message: "No room found" }, { status: 404 });
    }

    let userRoomFavourites = currentUser?.favourites
      ? currentUser?.favourites
      : [];
    const isSavedRoomIncluded = userRoomFavourites.includes(room?.id);

    if (isSavedRoomIncluded) {
      // Remove the user ID from the favourites array
      userRoomFavourites = userRoomFavourites.filter((favId) => favId !== room?.id);
    } else {
      // Add the user ID to the favourites array
      userRoomFavourites.push(room?.id);
    }
    // const favouritesJson = JSON.stringify(favourites);
    // Update the room's favourites in the database
   const user =  await prisma.user.update({
      where: { id: currentUser?.id },
      data: { favourites: userRoomFavourites },
    });

 
    const message = isSavedRoomIncluded
      ? `${room.title} has been removed from your collections`
      : `${room.title} has been saved to your collections`;

    return NextResponse.json({
      message: message,
      favourite: !isSavedRoomIncluded,
      user: user,
    });
  } catch (error) {
    console.error("Error updating favourites:", error); // Log the error for debugging
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
