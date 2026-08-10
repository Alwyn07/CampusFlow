import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const documents = await prisma.ocrDocument.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        schedule: {
          include: {
            exam: { select: { id: true, title: true, code: true } },
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true, code: true } },
          },
        },
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { extractions: true },
        },
      },
    });

    return NextResponse.json({ items: documents });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch OCR documents.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
