import { NextResponse } from "next/server";

import { requireFaculty } from "@/lib/faculty-auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: Context) {
  const { faculty, error } = await requireFaculty();
  if (error) return error;

  const { id } = await context.params;
  const item = await prisma.marks.update({
    where: { id },
    data: {
      status: "VERIFIED",
      verifiedByUserId: faculty.userId,
      verifiedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: faculty.userId,
      type: "MARKS_SUBMITTED",
      title: "Marks approved",
      body: "A marks entry has been verified.",
      metadata: { marksId: id },
    },
  });

  return NextResponse.json({ item });
}
