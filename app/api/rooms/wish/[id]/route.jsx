// import prisma from "@/prisma";
// import getCurrentUserSession from "@/app/actions/getCurrentUser";
// import { NextResponse } from "next/server";

// export async function POST(request, { params }) {
//   const { id } = params;
//   const currentUser = await getCurrentUserSession();

//   // Check if the user exists
//   if (!currentUser) {
//     return NextResponse.json(
//       { message: "User not authenticated" },
//       { status: 401 }
//     );
//   }

//   if (!id) {
//     return NextResponse.json(
//       { message: "Room ID is required" },
//       { status: 400 }
//     );
//   }

//   try {
//     const room = await prisma.rooms.findUnique({
//       where: { id: id },
//     });

//     if (!room) {
//       return NextResponse.json({ message: "No room found" }, { status: 404 });
//     }

//     let favourites = room.favourites || [];
//     const isSavedRoomIncluded = favourites.includes(currentUser?.id);

//     if (isSavedRoomIncluded) {
//       // Remove the room ID from the favourites array
//       favourites = favourites.filter((favId) => favId !== currentUser?.id);
//     } else {
//       // Add the room ID to the favourites array
//       favourites.push(currentUser?.id);
//     }

//     // Update the user's favourites in the database
//   await prisma.rooms.update({
//       where: { id: id },
//       data: { favourites: favourites },
//     });

//     const message = isSavedRoomIncluded
//       ? `${room.title} has been removed from your collections`
//       : `${room.title} has been saved to your collections`;

//     return NextResponse.json({
//       message: message,
//       favourite: isSavedRoomIncluded,
//     });
//   } catch (error) {
//     console.error("Error updating favourites:", error); // Log the error for debugging
//     return NextResponse.json(
//       { message: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

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
    const room = await prisma.rooms.findUnique({
      where: { id: id },
    });

    if (!room) {
      return NextResponse.json({ message: "No room found" }, { status: 404 });
    }

    let favourites = room.favourites ? JSON.parse(room.favourites) : [];
    const isSavedRoomIncluded = favourites.includes(currentUser?.id);

    if (isSavedRoomIncluded) {
      // Remove the user ID from the favourites array
      favourites = favourites.filter((favId) => favId !== currentUser?.id);
      await prisma.rooms.findMany({});
    } else {
      // Add the user ID to the favourites array
      favourites.push(currentUser?.id);
    }
    const favouritesJson = JSON.stringify(favourites);
    // Update the room's favourites in the database
    await prisma.rooms.update({
      where: { id: id },
      data: { favourites: favouritesJson },
    });

 
    const message = isSavedRoomIncluded
      ? `${room.title} has been removed from your collections`
      : `${room.title} has been saved to your collections`;

    return NextResponse.json({
      message: message,
      favourite: !isSavedRoomIncluded,
    });
  } catch (error) {
    console.error("Error updating favourites:", error); // Log the error for debugging
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
