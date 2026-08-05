import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { subjectSchema } from "@/lib/admin-validators";
import { prisma } from "@/lib/prisma";

function subjectData(data: ReturnType<typeof subjectSchema.parse>) {
  return {
    ...data,
    coordinatorFacultyId: data.coordinatorFacultyId || null,
  };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const items = await prisma.subject.findMany({
    orderBy: { code: "asc" },
    include: { department: true, coordinator: { include: { user: true } } },
  });

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      maxMarks: Number(item.maxMarks),
      passingMarks: Number(item.passingMarks),
      departmentName: item.department.name,
      coordinatorName: item.coordinator?.user.name ?? "-",
    })),
  });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = subjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subject data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.subject.create({ data: subjectData(parsed.data) });
  return NextResponse.json({ item }, { status: 201 });
}
