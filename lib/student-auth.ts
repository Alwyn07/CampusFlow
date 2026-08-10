import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function requireStudent() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "STUDENT") {
    return {
      session: null,
      student: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: { user: true, class: { include: { department: true } } },
  });

  if (!student) {
    return {
      session,
      student: null,
      error: NextResponse.json(
        { error: "Student profile not found." },
        { status: 404 },
      ),
    };
  }

  return { session, student, error: null };
}
