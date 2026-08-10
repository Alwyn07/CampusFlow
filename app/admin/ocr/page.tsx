import { OcrWorkspace } from "@/components/admin/ocr/ocr-workspace";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOcrPage() {
  const [schedules, documents] = await Promise.all([
    prisma.examSchedule.findMany({
      orderBy: [{ scheduleDate: "desc" }],
      include: {
        exam: { select: { title: true, code: true } },
        class: { select: { name: true, code: true } },
        subject: { select: { name: true, code: true } },
      },
    }),
    prisma.ocrDocument.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        schedule: {
          include: {
            exam: { select: { title: true, code: true } },
            subject: { select: { name: true, code: true } },
            class: { select: { name: true, code: true } },
          },
        },
        uploadedBy: {
          select: { name: true, email: true },
        },
        _count: {
          select: { extractions: true },
        },
      },
    }),
  ]);

  const serializedSchedules = schedules.map((s) => ({
    id: s.id,
    examTitle: s.exam.title,
    classCode: s.class.code,
    subjectCode: s.subject.code,
    subjectName: s.subject.name,
    scheduleDate: s.scheduleDate.toISOString(),
  }));

  const serializedDocuments = documents.map((doc) => ({
    id: doc.id,
    originalFileName: doc.originalFileName,
    mimeType: doc.mimeType,
    status: doc.status,
    provider: doc.provider,
    confidenceScore: doc.confidenceScore ? Number(doc.confidenceScore) : null,
    errorMessage: doc.errorMessage,
    createdAt: doc.createdAt.toISOString(),
    schedule: doc.schedule,
    uploadedBy: doc.uploadedBy,
    _count: doc._count,
  }));

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">AI Mark Sheet OCR Verification</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload scanned physical mark sheets, verify extracted student marks, correct edge cases, and apply to the official marks ledger.
        </p>
      </div>

      <OcrWorkspace
        initialSchedules={serializedSchedules}
        initialDocuments={serializedDocuments}
      />
    </div>
  );
}
