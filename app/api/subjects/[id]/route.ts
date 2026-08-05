import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { subjectSchema } from "@/lib/admin-validators";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

function subjectData(data: ReturnType<typeof subjectSchema.parse>) {
  return {
    ...data,
    coordinatorFacultyId: data.coordinatorFacultyId || null,
  };
}

export async function PATCH(request: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = subjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subject data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.subject.update({ where: { id }, data: subjectData(parsed.data) });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  try {
    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete related classes, schedules, or marks before deleting this subject." }, { status: 409 });
  }
}
