import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function requireFaculty() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "FACULTY") {
    return {
      session: null,
      faculty: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const faculty = await prisma.faculty.findUnique({
    where: { userId: session.user.id },
    include: { user: true, department: true },
  });

  if (!faculty) {
    return {
      session,
      faculty: null,
      error: NextResponse.json(
        { error: "Faculty profile not found." },
        { status: 404 },
      ),
    };
  }

  return { session, faculty, error: null };
}
