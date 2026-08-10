import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;

  try {
    const document = await prisma.ocrDocument.findUnique({
      where: { id },
      include: {
        schedule: {
          include: {
            exam: true,
            subject: true,
            class: {
              include: {
                students: {
                  include: { user: true },
                },
              },
            },
          },
        },
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        extractions: {
          orderBy: { createdAt: "asc" },
          include: {
            student: {
              include: { user: true },
            },
            marks: true,
            reviewedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "OCR Document not found." }, { status: 404 });
    }

    return NextResponse.json({ item: document });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch document detail.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
