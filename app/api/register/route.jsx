import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, username } = body;

    if (!email || !password || !name || !username) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        username,
        role: "user",
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error); // Log the error for debugging
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
