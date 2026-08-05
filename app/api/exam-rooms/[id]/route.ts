import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { roomSchema } from "@/lib/admin-validators";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = roomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid hall data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.examRoom.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  try {
    await prisma.examRoom.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Remove allocations and assignments before deleting this hall." }, { status: 409 });
  }
}
