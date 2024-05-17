import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
export async function POST(request) {
  const body = request.json();
  const { email, password, name } = body;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      hashedPassword,
    },
  });

  return NextResponse.json(user)
}
