export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { message: "Room Id is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

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
