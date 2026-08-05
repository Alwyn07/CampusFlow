import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { classSchema } from "@/lib/admin-validators";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const items = await prisma.class.findMany({
    orderBy: [{ academicYear: "desc" }, { semester: "asc" }],
    include: { department: true, _count: { select: { students: true } } },
  });

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      departmentName: item.department.name,
      studentCount: item._count.students,
    })),
  });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = classSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid class data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.class.create({ data: parsed.data });
  return NextResponse.json({ item }, { status: 201 });
}
