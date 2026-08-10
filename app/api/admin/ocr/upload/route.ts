import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/admin-auth";
import { ocrService } from "@/lib/ocr-service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const scheduleId = formData.get("scheduleId") as string | null;

    if (!file || !scheduleId) {
      return NextResponse.json(
        { error: "Both 'file' and 'scheduleId' are required." },
        { status: 400 }
      );
    }

    // Verify exam schedule exists
    const schedule = await prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        class: {
          include: {
            students: {
              include: { user: true },
            },
          },
        },
        subject: true,
        exam: true,
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Exam schedule not found." }, { status: 404 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const originalFileName = file.name || "scanned-doc.png";
    const mimeType = file.type || "image/png";

    // Save to uploads folder
    const uploadDir = path.join(process.cwd(), "public", "uploads", "ocr");
    await mkdir(uploadDir, { recursive: true });
    const uniqueFileName = `${Date.now()}-${originalFileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const storagePath = path.join("public", "uploads", "ocr", uniqueFileName);
    const fullDiskPath = path.join(process.cwd(), storagePath);
    await writeFile(fullDiskPath, fileBuffer);

    // 1. Create OcrDocument with PROCESSING status
    const ocrDocument = await prisma.ocrDocument.create({
      data: {
        scheduleId,
        uploadedByUserId: session.user.id,
        storageBucket: "LOCAL_FILESYSTEM",
        storagePath: `/uploads/ocr/${uniqueFileName}`,
        originalFileName,
        mimeType,
        fileSizeBytes: file.size,
        status: "PROCESSING",
      },
    });

    // 2. Process with OCR service
    const parsed = await ocrService.processDocument(fileBuffer, mimeType);

    // 3. Create OcrExtractions and match students
    const classStudents = schedule.class.students || [];

    const extractionsData = parsed.extractedRows.map((row) => {
      // Auto-match student by roll number, reg number, or name
      const matchedStudent = classStudents.find((st) => {
        if (!row.rollNumber) return false;
        const normalizedRoll = row.rollNumber.toLowerCase();
        const stRoll = st.rollNumber.toLowerCase();
        const stReg = st.registrationNumber.toLowerCase();
        return stRoll === normalizedRoll || stReg === normalizedRoll || stRoll.endsWith(normalizedRoll);
      }) || classStudents.find((st) => {
        if (!row.studentName) return false;
        return st.user.name.toLowerCase().includes(row.studentName.toLowerCase());
      });

      return {
        documentId: ocrDocument.id,
        studentId: matchedStudent ? matchedStudent.id : null,
        extractedRollNumber: row.rollNumber,
        extractedName: row.studentName,
        extractedMarks: row.marks !== null ? new Prisma.Decimal(row.marks) : null,
        rawText: row.rawLine,
        confidenceScore: new Prisma.Decimal(row.confidenceScore),
        reviewStatus: "PENDING" as const,
      };
    });

    if (extractionsData.length > 0) {
      await prisma.ocrExtraction.createMany({
        data: extractionsData,
      });
    }

    // 4. Update OcrDocument status to PROCESSED
    const updatedDocument = await prisma.ocrDocument.update({
      where: { id: ocrDocument.id },
      data: {
        status: parsed.error ? "FAILED" : "PROCESSED",
        provider: parsed.provider,
        confidenceScore: new Prisma.Decimal(parsed.overallConfidence),
        errorMessage: parsed.error || null,
        processedAt: new Date(),
      },
      include: {
        schedule: {
          include: { exam: true, subject: true, class: true },
        },
        extractions: {
          include: { student: { include: { user: true } } },
        },
      },
    });

    // 5. Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "OCR_PROCESS",
        entityType: "OcrDocument",
        entityId: ocrDocument.id,
        metadata: {
          originalFileName,
          scheduleId,
          provider: parsed.provider,
          overallConfidence: parsed.overallConfidence,
          extractedRowsCount: extractionsData.length,
        },
      },
    });

    return NextResponse.json({ document: updatedDocument }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload and process document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
