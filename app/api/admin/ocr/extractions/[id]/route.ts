import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const existingExtraction = await prisma.ocrExtraction.findUnique({
    where: { id },
    include: {
      document: {
        include: {
          schedule: {
            include: {
              class: {
                include: { students: { include: { user: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!existingExtraction) {
    return NextResponse.json({ error: "OCR extraction record not found." }, { status: 404 });
  }

  const extractedRollNumber =
    body.extractedRollNumber !== undefined
      ? body.extractedRollNumber
      : existingExtraction.extractedRollNumber;
  const extractedName =
    body.extractedName !== undefined ? body.extractedName : existingExtraction.extractedName;
  const extractedMarks =
    body.extractedMarks !== undefined ? body.extractedMarks : existingExtraction.extractedMarks;
  const reviewStatus = body.reviewStatus || existingExtraction.reviewStatus;

  // Re-match student if roll number changed or student is unassigned
  let studentId = existingExtraction.studentId;
  if (extractedRollNumber && (extractedRollNumber !== existingExtraction.extractedRollNumber || !studentId)) {
    const classStudents = existingExtraction.document.schedule.class.students || [];
    const matched = classStudents.find((st) => {
      const norm = extractedRollNumber.trim().toLowerCase();
      return (
        st.rollNumber.toLowerCase() === norm ||
        st.registrationNumber.toLowerCase() === norm ||
        st.rollNumber.toLowerCase().endsWith(norm)
      );
    });
    if (matched) {
      studentId = matched.id;
    }
  }

  try {
    const updated = await prisma.ocrExtraction.update({
      where: { id },
      data: {
        extractedRollNumber,
        extractedName,
        extractedMarks:
          extractedMarks !== null && extractedMarks !== undefined
            ? new Prisma.Decimal(extractedMarks)
            : null,
        reviewStatus,
        studentId,
        reviewedByUserId: session.user.id,
        reviewedAt: new Date(),
      },
      include: {
        student: { include: { user: true } },
      },
    });

    return NextResponse.json({ item: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update extraction record.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
