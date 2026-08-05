import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { classSchema } from "@/lib/admin-validators";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = classSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid class data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.class.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  try {
    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete related students, schedules, or results before deleting this class." }, { status: 409 });
  }
}
