import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: Context) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const document = await prisma.ocrDocument.findUnique({
      where: { id },
      include: {
        schedule: {
          include: {
            subject: true,
            exam: true,
            class: {
              include: {
                students: { include: { user: true } },
              },
            },
          },
        },
        extractions: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "OCR document not found." }, { status: 404 });
    }

    if (document.status === "APPLIED") {
      return NextResponse.json(
        { error: "This OCR document has already been applied to the marks ledger." },
        { status: 400 }
      );
    }

    const validExtractions = document.extractions.filter(
      (ext) => ext.reviewStatus === "ACCEPTED" || ext.reviewStatus === "CORRECTED"
    );

    if (validExtractions.length === 0) {
      return NextResponse.json(
        { error: "No ACCEPTED or CORRECTED extractions to apply. Please review and accept extractions first." },
        { status: 400 }
      );
    }

    const { examId, subjectId } = document.schedule;
    const { maxMarks, passingMarks } = document.schedule.subject;
    const classStudents = document.schedule.class.students;

    let appliedCount = 0;
    const updatedExtractionIds: string[] = [];

    for (const extraction of validExtractions) {
      // Resolve studentId if not already assigned
      let studentId = extraction.studentId;
      if (!studentId && extraction.extractedRollNumber) {
        const norm = extraction.extractedRollNumber.trim().toLowerCase();
        const matched = classStudents.find(
          (st) =>
            st.rollNumber.toLowerCase() === norm ||
            st.registrationNumber.toLowerCase() === norm ||
            st.rollNumber.toLowerCase().endsWith(norm)
        );
        if (matched) {
          studentId = matched.id;
        }
      }

      if (!studentId || extraction.extractedMarks === null) {
        continue;
      }

      const marksObtained = new Prisma.Decimal(extraction.extractedMarks.toString());

      // Safely upsert Marks using the @@unique([examId, studentId, subjectId]) constraint
      const marksRecord = await prisma.marks.upsert({
        where: {
          examId_studentId_subjectId: {
            examId,
            studentId,
            subjectId,
          },
        },
        create: {
          examId,
          studentId,
          subjectId,
          enteredByUserId: session.user.id,
          marksObtained,
          maxMarks: new Prisma.Decimal(maxMarks.toString()),
          passingMarks: new Prisma.Decimal(passingMarks.toString()),
          source: "OCR",
          ocrConfidence: extraction.confidenceScore,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
        update: {
          marksObtained,
          source: "OCR",
          ocrConfidence: extraction.confidenceScore,
          enteredByUserId: session.user.id,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      // Link marksId back to OcrExtraction
      await prisma.ocrExtraction.update({
        where: { id: extraction.id },
        data: {
          marksId: marksRecord.id,
          studentId,
        },
      });

      appliedCount++;
      updatedExtractionIds.push(extraction.id);
    }

    // Mark document status as APPLIED
    const updatedDocument = await prisma.ocrDocument.update({
      where: { id },
      data: {
        status: "APPLIED",
      },
    });

    // Create Audit Log entry
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "APPROVE",
        entityType: "OcrDocument",
        entityId: id,
        metadata: {
          scheduleId: document.scheduleId,
          totalApplied: appliedCount,
          extractionIds: updatedExtractionIds,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      appliedCount,
      document: updatedDocument,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to apply OCR extractions to marks ledger.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
