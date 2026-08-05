import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { facultySchema } from "@/lib/admin-validators";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = facultySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid faculty data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const current = await prisma.faculty.findUnique({ where: { id }, select: { userId: true } });
  if (!current) {
    return NextResponse.json({ error: "Faculty not found." }, { status: 404 });
  }

  const { name, email, phone, ...faculty } = parsed.data;
  const item = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: current.userId },
      data: { name, email, phone },
    });

    return tx.faculty.update({
      where: { id },
      data: faculty,
      include: { user: true, department: true },
    });
  });

  return NextResponse.json({ item });
}

export async function DELETE(_: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const current = await prisma.faculty.findUnique({ where: { id }, select: { userId: true } });
  if (!current) {
    return NextResponse.json({ error: "Faculty not found." }, { status: 404 });
  }

  try {
    await prisma.user.delete({ where: { id: current.userId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete faculty with linked exam assignments." }, { status: 409 });
  }
}
