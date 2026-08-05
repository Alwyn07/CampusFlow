import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { examSchema } from "@/lib/admin-validators";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

function examData(data: ReturnType<typeof examSchema.parse>) {
  return {
    ...data,
    startsOn: data.startsOn ? new Date(data.startsOn) : null,
    endsOn: data.endsOn ? new Date(data.endsOn) : null,
  };
}

export async function PATCH(request: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = examSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid exam data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.exam.update({ where: { id }, data: examData(parsed.data) });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  await prisma.exam.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
