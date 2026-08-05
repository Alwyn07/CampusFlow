import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { departmentSchema } from "@/lib/admin-validators";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = departmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid department data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.department.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;

  try {
    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete related classes, subjects, or faculty before deleting this department." }, { status: 409 });
  }
}
