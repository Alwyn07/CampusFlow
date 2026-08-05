import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  await prisma.scheduleRoom.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
