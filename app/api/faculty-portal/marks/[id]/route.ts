import { NextResponse } from "next/server";

import { requireFaculty } from "@/lib/faculty-auth";
import { facultyMarksSchema } from "@/lib/faculty-validators";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { faculty, error } = await requireFaculty();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = facultyMarksSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid marks data.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const item = await prisma.marks.update({
    where: { id },
    data: {
      marksObtained: parsed.data.marksObtained,
      maxMarks: parsed.data.maxMarks,
      passingMarks: parsed.data.passingMarks,
      grade: parsed.data.grade || null,
      status: parsed.data.status,
      enteredByUserId: faculty.userId,
      submittedAt: parsed.data.status === "SUBMITTED" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ item });
}
