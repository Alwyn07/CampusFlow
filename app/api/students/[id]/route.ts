import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { studentSchema } from "@/lib/admin-validators";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

function studentData(data: ReturnType<typeof studentSchema.parse>) {
  const { name, email, phone, gender, admissionNumber, ...student } = data;
  return {
    user: { name, email, phone },
    student: {
      ...student,
      admissionNumber: admissionNumber || null,
      gender: gender || null,
    },
  };
}

export async function PATCH(request: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid student data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const current = await prisma.student.findUnique({ where: { id }, select: { userId: true } });
  if (!current) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const data = studentData(parsed.data);
  const item = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: current.userId }, data: data.user });
    return tx.student.update({
      where: { id },
      data: data.student,
      include: { user: true, class: true },
    });
  });

  return NextResponse.json({ item });
}

export async function DELETE(_: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const current = await prisma.student.findUnique({ where: { id }, select: { userId: true } });
  if (!current) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  try {
    await prisma.user.delete({ where: { id: current.userId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete student with linked marks, attendance, or results." }, { status: 409 });
  }
}
